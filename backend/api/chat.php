<?php
require_once __DIR__ . '/cors.php';
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (!headers_sent()) {
    header('Content-Type: application/json');
}
if (session_status() !== PHP_SESSION_ACTIVE && !headers_sent()) {
    session_start();
}

require_once __DIR__ . '/db.php';
global $pdo;

$action = $_GET['action'] ?? '';

// Global User Format Helper
function formatUserId($role, $id) {
    $prefix = ($role === 'student') ? 'STU' : (($role === 'staff') ? 'STF' : 'ADM');
    return $prefix . '-' . str_pad($id, 4, '0', STR_PAD_LEFT);
}

// 1. Authenticate Session
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
    exit;
}

$currentUser = $_SESSION['user'];
$myId = (int)$currentUser['id'];
$myRole = $currentUser['role'] ?? 'student';
$myName = $currentUser['name'] ?? 'User';

// 2. Student Fee Lock Check: Unpaid students are restricted from campus chat
if ($myRole === 'student') {
    $isPaid = !empty($currentUser['is_paid']);
    if (!$isPaid) {
        // Double check directly from database
        try {
            $chk = $pdo->prepare("SELECT is_paid, paid_until FROM users WHERE id = ?");
            $chk->execute([$myId]);
            $uRow = $chk->fetch(PDO::FETCH_ASSOC);
            if ($uRow) {
                if (!empty($uRow['is_paid'])) {
                    if (!empty($uRow['paid_until']) && strtotime($uRow['paid_until']) < time()) {
                        $isPaid = false;
                    } else {
                        $isPaid = true;
                    }
                }
            }
        } catch (Exception $e) {}

        if (!$isPaid) {
            http_response_code(402);
            echo json_encode([
                'success' => false,
                'message' => 'Your student portal is locked until term school fees are paid. Please settle tuition to access Campus Chat.'
            ]);
            exit;
        }
    }
}

// ==========================================================================
// ACTION: GET SIDEBAR (CHANNELS & CONTACT DIRECTORY)
// ==========================================================================
if ($action === 'get_sidebar') {
    try {
        $myPattern = '%,' . $myId . ',%';

        // 1. General Group Summary (excluding messages deleted for current user)
        $stmtGen = $pdo->prepare("
            SELECT m.id, m.message, m.created_at, u.name AS sender_name, u.role AS sender_role
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.channel_type = 'group' AND m.channel_name = 'general' AND m.deleted_at IS NULL
              AND (m.deleted_for_users IS NULL OR CONCAT(',', m.deleted_for_users, ',') NOT LIKE ?)
            ORDER BY m.id DESC LIMIT 1
        ");
        $stmtGen->execute([$myPattern]);
        $lastGeneral = $stmtGen->fetch(PDO::FETCH_ASSOC);

        $totalMembersStmt = $pdo->query("SELECT COUNT(*) FROM users");
        $totalMembers = (int)$totalMembersStmt->fetchColumn();

        $generalChannel = [
            'id' => 'general',
            'type' => 'group',
            'name' => 'General Community Group',
            'topic' => 'Public campus forum for all Students, Staff & Administration',
            'total_members' => $totalMembers,
            'last_message' => $lastGeneral ? ($lastGeneral['sender_name'] . ': ' . mb_substr($lastGeneral['message'], 0, 50)) : 'No messages yet',
            'last_message_time' => $lastGeneral ? $lastGeneral['created_at'] : null
        ];

        // 2. Fetch all contacts except current user
        $contactsStmt = $pdo->prepare("
            SELECT id, name, email, role, department, program
            FROM users
            WHERE id != ?
            ORDER BY 
                CASE role 
                    WHEN 'admin' THEN 1 
                    WHEN 'staff' THEN 2 
                    ELSE 3 
                END ASC,
                name ASC
        ");
        $contactsStmt->execute([$myId]);
        $allUsers = $contactsStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Batch query unread direct messages per sender for current user
        $unreadStmt = $pdo->prepare("
            SELECT sender_id, COUNT(*) AS unread_count
            FROM chat_messages
            WHERE recipient_id = ? AND channel_type = 'direct' AND is_read = 0 AND deleted_at IS NULL
              AND (deleted_for_users IS NULL OR CONCAT(',', deleted_for_users, ',') NOT LIKE ?)
            GROUP BY sender_id
        ");
        $unreadStmt->execute([$myId, $myPattern]);
        $unreadMap = [];
        while ($row = $unreadStmt->fetch(PDO::FETCH_ASSOC)) {
            $unreadMap[$row['sender_id']] = (int)$row['unread_count'];
        }

        // 4. Batch query last message exchanged with each user
        $lastDmStmt = $pdo->prepare("
            SELECT m.sender_id, m.recipient_id, m.message, m.created_at,
                   IF(m.sender_id = ?, m.recipient_id, m.sender_id) AS other_user_id
            FROM chat_messages m
            INNER JOIN (
                SELECT MAX(id) AS max_id
                FROM chat_messages
                WHERE channel_type = 'direct' AND deleted_at IS NULL
                  AND (sender_id = ? OR recipient_id = ?)
                  AND (deleted_for_users IS NULL OR CONCAT(',', deleted_for_users, ',') NOT LIKE ?)
                GROUP BY IF(sender_id = ?, recipient_id, sender_id)
            ) latest ON m.id = latest.max_id
        ");
        $lastDmStmt->execute([$myId, $myId, $myId, $myPattern, $myId]);
        $lastDmMap = [];
        while ($dm = $lastDmStmt->fetch(PDO::FETCH_ASSOC)) {
            $lastDmMap[$dm['other_user_id']] = [
                'message' => $dm['message'],
                'created_at' => $dm['created_at'],
                'is_mine' => ((int)$dm['sender_id'] === $myId)
            ];
        }

        $contacts = [];
        $totalUnreadDms = 0;

        foreach ($allUsers as $u) {
            $uid = (int)$u['id'];
            $unread = $unreadMap[$uid] ?? 0;
            $totalUnreadDms += $unread;
            $lastDm = $lastDmMap[$uid] ?? null;

            $contacts[] = [
                'id' => $uid,
                'name' => $u['name'],
                'email' => $u['email'],
                'role' => $u['role'],
                'formatted_id' => formatUserId($u['role'], $uid),
                'department' => $u['department'] ?? 'General',
                'program' => $u['program'] ?? '',
                'unread_count' => $unread,
                'last_message' => $lastDm ? (($lastDm['is_mine'] ? 'You: ' : '') . mb_substr($lastDm['message'], 0, 45) . (mb_strlen($lastDm['message']) > 45 ? '...' : '')) : null,
                'last_message_time' => $lastDm ? $lastDm['created_at'] : null
            ];
        }

        echo json_encode([
            'success' => true,
            'current_user' => [
                'id' => $myId,
                'name' => $myName,
                'role' => $myRole,
                'formatted_id' => formatUserId($myRole, $myId)
            ],
            'general_channel' => $generalChannel,
            'contacts' => $contacts,
            'total_unread_dms' => $totalUnreadDms
        ]);
        exit;

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// ==========================================================================
// ACTION: GET MESSAGES (FOR GENERAL CHANNEL OR DIRECT MESSAGE THREAD)
// ==========================================================================
if ($action === 'get_messages') {
    $type = $_GET['type'] ?? 'group';
    $target = $_GET['target'] ?? 'general';
    $lastId = isset($_GET['last_id']) ? (int)$_GET['last_id'] : 0;

    try {
        if ($type === 'group') {
            $channelName = preg_replace('/[^a-zA-Z0-9_-]/', '', $target) ?: 'general';

            $myPattern = '%,' . $myId . ',%';

            $sql = "
                SELECT m.id, m.sender_id, m.recipient_id, m.channel_type, m.channel_name,
                       m.message, m.is_read, m.created_at,
                       u.name AS sender_name, u.role AS sender_role, u.department AS sender_department, u.program AS sender_program
                FROM chat_messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.channel_type = 'group' AND m.channel_name = :target AND m.deleted_at IS NULL
                  AND (m.deleted_for_users IS NULL OR CONCAT(',', m.deleted_for_users, ',') NOT LIKE :myPattern)
            ";
            $params = [
                ':target' => $channelName,
                ':myPattern' => $myPattern
            ];

            if ($lastId > 0) {
                $sql .= " AND m.id > :last_id";
                $params[':last_id'] = $lastId;
            }

            $sql .= " ORDER BY m.id ASC LIMIT 100";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rawMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $messages = array_map(function($m) use ($myId) {
                $sid = (int)$m['sender_id'];
                return [
                    'id' => (int)$m['id'],
                    'sender_id' => $sid,
                    'sender_name' => $m['sender_name'],
                    'sender_role' => $m['sender_role'],
                    'sender_formatted_id' => formatUserId($m['sender_role'], $sid),
                    'sender_department' => $m['sender_department'],
                    'sender_program' => $m['sender_program'],
                    'recipient_id' => null,
                    'channel_type' => 'group',
                    'channel_name' => $m['channel_name'],
                    'message' => $m['message'],
                    'created_at' => $m['created_at'],
                    'formatted_time' => date('M j, g:i A', strtotime($m['created_at'])),
                    'is_mine' => ($sid === $myId)
                ];
            }, $rawMessages);

            echo json_encode([
                'success' => true,
                'type' => 'group',
                'channel' => $channelName,
                'messages' => $messages,
                'target_info' => [
                    'id' => 'general',
                    'name' => 'General Community Group',
                    'role' => 'public_channel',
                    'description' => 'Public campus forum for all Students, Staff & Administration'
                ]
            ]);
            exit;

        } else {
            // Direct Message Thread
            $recipientId = (int)$target;
            if ($recipientId <= 0 || $recipientId === $myId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid recipient for direct messaging.']);
                exit;
            }

            // Fetch recipient info
            $uStmt = $pdo->prepare("SELECT id, name, email, role, department, program FROM users WHERE id = ?");
            $uStmt->execute([$recipientId]);
            $recipientUser = $uStmt->fetch(PDO::FETCH_ASSOC);
            if (!$recipientUser) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Recipient not found.']);
                exit;
            }

            // Fetch direct messages between the two users (excluding messages deleted for current user)
            $myPattern = '%,' . $myId . ',%';

            $sql = "
                SELECT m.id, m.sender_id, m.recipient_id, m.channel_type, m.channel_name,
                       m.message, m.is_read, m.created_at,
                       u.name AS sender_name, u.role AS sender_role, u.department AS sender_department, u.program AS sender_program
                FROM chat_messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.channel_type = 'direct' AND m.deleted_at IS NULL
                  AND (
                    (m.sender_id = ? AND m.recipient_id = ?)
                    OR
                    (m.sender_id = ? AND m.recipient_id = ?)
                  )
                  AND (m.deleted_for_users IS NULL OR CONCAT(',', m.deleted_for_users, ',') NOT LIKE ?)
            ";
            $params = [$myId, $recipientId, $recipientId, $myId, $myPattern];

            if ($lastId > 0) {
                $sql .= " AND m.id > ?";
                $params[] = $lastId;
            }

            $sql .= " ORDER BY m.id ASC LIMIT 150";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rawMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Automatically mark incoming messages from this recipient as read
            $readStmt = $pdo->prepare("
                UPDATE chat_messages
                SET is_read = 1
                WHERE sender_id = ? AND recipient_id = ? AND is_read = 0 AND channel_type = 'direct'
            ");
            $readStmt->execute([$recipientId, $myId]);

            $messages = array_map(function($m) use ($myId) {
                $sid = (int)$m['sender_id'];
                return [
                    'id' => (int)$m['id'],
                    'sender_id' => $sid,
                    'sender_name' => $m['sender_name'],
                    'sender_role' => $m['sender_role'],
                    'sender_formatted_id' => formatUserId($m['sender_role'], $sid),
                    'sender_department' => $m['sender_department'],
                    'sender_program' => $m['sender_program'],
                    'recipient_id' => (int)$m['recipient_id'],
                    'channel_type' => 'direct',
                    'message' => $m['message'],
                    'is_read' => (int)$m['is_read'],
                    'created_at' => $m['created_at'],
                    'formatted_time' => date('M j, g:i A', strtotime($m['created_at'])),
                    'is_mine' => ($sid === $myId)
                ];
            }, $rawMessages);

            echo json_encode([
                'success' => true,
                'type' => 'direct',
                'recipient_id' => $recipientId,
                'messages' => $messages,
                'target_info' => [
                    'id' => (int)$recipientUser['id'],
                    'name' => $recipientUser['name'],
                    'email' => $recipientUser['email'],
                    'role' => $recipientUser['role'],
                    'formatted_id' => formatUserId($recipientUser['role'], (int)$recipientUser['id']),
                    'department' => $recipientUser['department'] ?? 'General',
                    'program' => $recipientUser['program'] ?? ''
                ]
            ]);
            exit;
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// ==========================================================================
// ACTION: SEND MESSAGE (GROUP OR DIRECT)
// ==========================================================================
if ($action === 'send_message') {
    $rawInput = file_get_contents('php://input');
    $json = !empty($rawInput) ? json_decode($rawInput, true) : null;
    $input = (is_array($json) && !empty($json)) ? $json : $_POST;

    $type = $input['type'] ?? 'group';
    $target = $input['target'] ?? 'general';
    $text = trim($input['message'] ?? '');

    if ($text === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message text cannot be empty.']);
        exit;
    }

    if (mb_strlen($text) > 3000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message is too long (maximum 3,000 characters).']);
        exit;
    }

    // Preserve natural user text as-is; PDO prepared statements guarantee SQL safety
    $cleanText = trim($text);

    try {
        if ($type === 'group') {
            $channelName = preg_replace('/[^a-zA-Z0-9_-]/', '', $target) ?: 'general';

            $ins = $pdo->prepare("
                INSERT INTO chat_messages (sender_id, recipient_id, channel_type, channel_name, message, is_read, created_at)
                VALUES (?, NULL, 'group', ?, ?, 0, NOW())
            ");
            $ins->execute([$myId, $channelName, $cleanText]);
            $msgId = (int)$pdo->lastInsertId();

            $msgData = [
                'id' => $msgId,
                'sender_id' => $myId,
                'sender_name' => $myName,
                'sender_role' => $myRole,
                'sender_formatted_id' => formatUserId($myRole, $myId),
                'sender_department' => $currentUser['department'] ?? '',
                'sender_program' => $currentUser['program'] ?? '',
                'recipient_id' => null,
                'channel_type' => 'group',
                'channel_name' => $channelName,
                'message' => $cleanText,
                'is_mine' => true,
                'created_at' => date('Y-m-d H:i:s'),
                'formatted_time' => date('M j, g:i A')
            ];

            echo json_encode([
                'success' => true,
                'message' => 'Message sent to ' . $channelName,
                'data' => $msgData
            ]);
            exit;

        } else {
            // Direct Message
            $recipientId = (int)$target;
            if ($recipientId <= 0 || $recipientId === $myId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid recipient for direct message.']);
                exit;
            }

            // Verify recipient exists
            $chkRecip = $pdo->prepare("SELECT id, name, role FROM users WHERE id = ?");
            $chkRecip->execute([$recipientId]);
            $recip = $chkRecip->fetch(PDO::FETCH_ASSOC);
            if (!$recip) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Recipient user not found.']);
                exit;
            }

            $ins = $pdo->prepare("
                INSERT INTO chat_messages (sender_id, recipient_id, channel_type, channel_name, message, is_read, created_at)
                VALUES (?, ?, 'direct', 'direct', ?, 0, NOW())
            ");
            $ins->execute([$myId, $recipientId, $cleanText]);
            $msgId = (int)$pdo->lastInsertId();

            $msgData = [
                'id' => $msgId,
                'sender_id' => $myId,
                'sender_name' => $myName,
                'sender_role' => $myRole,
                'sender_formatted_id' => formatUserId($myRole, $myId),
                'sender_department' => $currentUser['department'] ?? '',
                'sender_program' => $currentUser['program'] ?? '',
                'recipient_id' => $recipientId,
                'recipient_name' => $recip['name'],
                'channel_type' => 'direct',
                'message' => $cleanText,
                'is_read' => 0,
                'is_mine' => true,
                'created_at' => date('Y-m-d H:i:s'),
                'formatted_time' => date('M j, g:i A')
            ];

            echo json_encode([
                'success' => true,
                'message' => 'Direct message sent to ' . $recip['name'],
                'data' => $msgData
            ]);
            exit;
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// ==========================================================================
// ACTION: DELETE MESSAGE (FOR ME OR FOR EVERYONE)
// ==========================================================================
if ($action === 'delete_message') {
    $rawInput = file_get_contents('php://input');
    $json = !empty($rawInput) ? json_decode($rawInput, true) : null;
    $input = (is_array($json) && !empty($json)) ? $json : $_POST;
    $msgId = (int)($input['message_id'] ?? 0);
    $deleteMode = trim($input['delete_mode'] ?? 'for_everyone'); // 'for_me' or 'for_everyone'

    if ($msgId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid message ID.']);
        exit;
    }

    try {
        $st = $pdo->prepare("SELECT id, sender_id, recipient_id, channel_type, deleted_for_users FROM chat_messages WHERE id = ? AND deleted_at IS NULL");
        $st->execute([$msgId]);
        $msg = $st->fetch(PDO::FETCH_ASSOC);

        if (!$msg) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Message not found or already deleted.']);
            exit;
        }

        $isAuthor = ((int)$msg['sender_id'] === $myId);
        $isAdmin = ($myRole === 'admin');

        if ($deleteMode === 'for_me') {
            // Delete for me: hides message only for the current user
            $myIdStr = (string)$myId;
            $myPattern = '%,' . $myId . ',%';
            $del = $pdo->prepare("
                UPDATE chat_messages 
                SET deleted_for_users = CASE 
                    WHEN deleted_for_users IS NULL OR deleted_for_users = '' THEN ? 
                    WHEN CONCAT(',', deleted_for_users, ',') LIKE ? THEN deleted_for_users
                    ELSE CONCAT(deleted_for_users, ',', ?) 
                END
                WHERE id = ?
            ");
            $del->execute([$myIdStr, $myPattern, $myIdStr, $msgId]);

            echo json_encode(['success' => true, 'delete_mode' => 'for_me', 'message' => 'Message deleted for you.']);
            exit;
        } else {
            // Delete for everyone:
            // Allowed if user sent the message, OR if user is an Administrator!
            if (!$isAuthor && !$isAdmin) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Permission denied. You can only delete your own messages for everyone. You may use "Delete for me" instead.']);
                exit;
            }

            $del = $pdo->prepare("UPDATE chat_messages SET deleted_at = NOW() WHERE id = ?");
            $del->execute([$msgId]);

            echo json_encode(['success' => true, 'delete_mode' => 'for_everyone', 'message' => 'Message deleted for everyone.']);
            exit;
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// ==========================================================================
// ACTION: CLEAR CHAT (IN OWN DMS FOR ME OR IN COMMUNITY GROUP BY ADMIN)
// ==========================================================================
if ($action === 'clear_chat') {
    $rawInput = file_get_contents('php://input');
    $json = !empty($rawInput) ? json_decode($rawInput, true) : null;
    $input = (is_array($json) && !empty($json)) ? $json : $_POST;

    $type = $input['type'] ?? 'direct'; // 'direct' or 'group'
    $target = $input['target'] ?? '';
    $clearMode = $input['clear_mode'] ?? 'for_me'; // 'for_me' or 'for_everyone'

    try {
        if ($type === 'direct') {
            $otherUserId = (int)$target;
            if ($otherUserId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid chat user ID.']);
                exit;
            }

            // In DMs, clear chat from "their end and not the other end" (for_me)
            $myIdStr = (string)$myId;
            $myPattern = '%,' . $myId . ',%';

            $stmt = $pdo->prepare("
                UPDATE chat_messages 
                SET deleted_for_users = CASE 
                    WHEN deleted_for_users IS NULL OR deleted_for_users = '' THEN ? 
                    WHEN CONCAT(',', deleted_for_users, ',') LIKE ? THEN deleted_for_users
                    ELSE CONCAT(deleted_for_users, ',', ?) 
                END
                WHERE channel_type = 'direct' 
                  AND deleted_at IS NULL
                  AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
            ");
            $stmt->execute([$myIdStr, $myPattern, $myIdStr, $myId, $otherUserId, $otherUserId, $myId]);

            echo json_encode(['success' => true, 'message' => 'Direct conversation cleared from your screen.']);
            exit;

        } else {
            // Community Group
            $channelName = preg_replace('/[^a-zA-Z0-9_-]/', '', $target) ?: 'general';

            if ($clearMode === 'for_everyone') {
                if ($myRole !== 'admin') {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Permission denied. Only administrators can clear the community group chat for everyone.']);
                    exit;
                }

                $stmt = $pdo->prepare("
                    UPDATE chat_messages 
                    SET deleted_at = NOW() 
                    WHERE channel_type = 'group' AND channel_name = ? AND deleted_at IS NULL
                ");
                $stmt->execute([$channelName]);

                echo json_encode(['success' => true, 'message' => 'Community group chat has been completely cleared for everyone by Administrator.']);
                exit;
            } else {
                // Clear for me in community group
                $myIdStr = (string)$myId;
                $myPattern = '%,' . $myId . ',%';

                $stmt = $pdo->prepare("
                    UPDATE chat_messages 
                    SET deleted_for_users = CASE 
                        WHEN deleted_for_users IS NULL OR deleted_for_users = '' THEN ? 
                        WHEN CONCAT(',', deleted_for_users, ',') LIKE ? THEN deleted_for_users
                        ELSE CONCAT(deleted_for_users, ',', ?) 
                    END
                    WHERE channel_type = 'group' AND channel_name = ? AND deleted_at IS NULL
                ");
                $stmt->execute([$myIdStr, $myPattern, $myIdStr, $channelName]);

                echo json_encode(['success' => true, 'message' => 'Community group messages cleared from your screen.']);
                exit;
            }
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// ==========================================================================
// ACTION: POLL UNREAD & LIGHTWEIGHT STATUS UPDATES
// ==========================================================================
if ($action === 'poll_unread') {
    try {
        // Total unread DMs
        $unStmt = $pdo->prepare("
            SELECT COUNT(*) FROM chat_messages
            WHERE recipient_id = ? AND channel_type = 'direct' AND is_read = 0 AND deleted_at IS NULL
        ");
        $unStmt->execute([$myId]);
        $totalUnreadDms = (int)$unStmt->fetchColumn();

        // Max ID in general channel
        $maxGenStmt = $pdo->query("
            SELECT MAX(id) FROM chat_messages
            WHERE channel_type = 'group' AND channel_name = 'general' AND deleted_at IS NULL
        ");
        $maxGeneralId = (int)$maxGenStmt->fetchColumn();

        echo json_encode([
            'success' => true,
            'total_unread_dms' => $totalUnreadDms,
            'latest_general_msg_id' => $maxGeneralId
        ]);
        exit;

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// Default fallback
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid chat API action.']);
