<?php
/**
 * School Notices & Staff Updates API
 * Allows Administrators to write, upload files, and edit notices
 * for Students and Staff independently.
 */
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/db.php';

// Authentication check
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$user = $_SESSION['user'];
$userRole = $user['role'] ?? 'student';
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

function formatNoticeFileSize($bytes) {
    if ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 1) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 0) . ' KB';
    }
    return $bytes . ' B';
}

try {
    // -------------------------------------------------------------------------
    // 1. GET NOTICES (Student, Staff, or Admin view)
    // -------------------------------------------------------------------------
    if ($action === 'get_notices') {
        $requestedTarget = trim($_GET['target'] ?? '');
        $categoryFilter  = trim($_GET['category'] ?? '');
        $search          = trim($_GET['search'] ?? '');

        $sql = "SELECT id, title, content, target_audience, category, 
                       attachment_url, attachment_name, attachment_type, attachment_size, 
                       author_id, author_name, is_pinned, created_at, updated_at 
                FROM school_notices WHERE 1=1";
        $params = [];

        // Role-based target audience enforcement
        if ($userRole === 'student') {
            // Students only see notices targeted at students or all
            $sql .= " AND target_audience IN ('student', 'all')";
        } elseif ($userRole === 'staff') {
            // Staff only see updates targeted at staff or all
            $sql .= " AND target_audience IN ('staff', 'all')";
        } else {
            // Admin can filter by specific target or view all
            if (!empty($requestedTarget) && in_array($requestedTarget, ['student', 'staff', 'all'])) {
                $sql .= " AND target_audience = ?";
                $params[] = $requestedTarget;
            }
        }

        if (!empty($categoryFilter) && $categoryFilter !== 'all') {
            $sql .= " AND category = ?";
            $params[] = $categoryFilter;
        }

        if (!empty($search)) {
            $sql .= " AND (title LIKE ? OR content LIKE ?)";
            $params[] = '%' . $search . '%';
            $params[] = '%' . $search . '%';
        }

        $sql .= " ORDER BY is_pinned DESC, created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $notices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch counts for Admin/Staff overview
        $counts = [
            'total'   => 0,
            'student' => 0,
            'staff'   => 0,
            'all'     => 0
        ];
        if ($userRole === 'admin') {
            $cStmt = $pdo->query("SELECT target_audience, COUNT(*) as cnt FROM school_notices GROUP BY target_audience");
            $rows = $cStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $counts[$r['target_audience']] = (int)$r['cnt'];
                $counts['total'] += (int)$r['cnt'];
            }
        }

        echo json_encode([
            'success' => true,
            'notices' => $notices,
            'counts'  => $counts,
            'total'   => count($notices)
        ]);
        exit;
    }

    // -------------------------------------------------------------------------
    // 2. GET SINGLE NOTICE (For edit modal)
    // -------------------------------------------------------------------------
    if ($action === 'get_notice') {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid notice ID.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM school_notices WHERE id = ?");
        $stmt->execute([$id]);
        $notice = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$notice) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Notice not found.']);
            exit;
        }

        echo json_encode(['success' => true, 'notice' => $notice]);
        exit;
    }

    // -------------------------------------------------------------------------
    // 3. CREATE NOTICE (Admin Only)
    // -------------------------------------------------------------------------
    if ($action === 'create_notice') {
        if ($userRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Permission denied. Only administrators can publish notices.']);
            exit;
        }

        $title          = trim($_POST['title'] ?? '');
        $content        = trim($_POST['content'] ?? '');
        $targetAudience = trim($_POST['target_audience'] ?? 'student');
        $category       = trim($_POST['category'] ?? 'official');
        $isPinned       = !empty($_POST['is_pinned']) ? 1 : 0;

        if (empty($title)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Notice title is required.']);
            exit;
        }

        if (empty($content)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Notice message content is required.']);
            exit;
        }

        if (!in_array($targetAudience, ['student', 'staff', 'all'])) {
            $targetAudience = 'student';
        }

        $validCategories = ['official', 'urgent', 'academic', 'administrative', 'event'];
        if (!in_array($category, $validCategories)) {
            $category = 'official';
        }

        // Handle optional file attachment upload
        $attachmentUrl  = null;
        $attachmentName = null;
        $attachmentType = null;
        $attachmentSize = null;

        if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['attachment'];
            $maxBytes = 25 * 1024 * 1024; // 25 MB
            if ($file['size'] > $maxBytes) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Attachment exceeds maximum 25MB file limit.']);
                exit;
            }

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'txt'];
            if (!in_array($ext, $allowedExts)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Unsupported attachment file format. Allowed: PDF, Word, Excel, PowerPoint, Images, ZIP, TXT.']);
                exit;
            }

            $uploadDir = __DIR__ . '/../uploads/notices/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $uniqueName = 'notice_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
            $destination = $uploadDir . $uniqueName;

            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $attachmentUrl  = 'uploads/notices/' . $uniqueName;
                $attachmentName = $file['name'];
                $attachmentType = $ext;
                $attachmentSize = formatNoticeFileSize($file['size']);
            }
        }

        $authorId = (int)$user['id'];
        $authorName = !empty($user['name']) ? $user['name'] : 'School Administration';

        $stmt = $pdo->prepare("
            INSERT INTO school_notices 
                (title, content, target_audience, category, attachment_url, attachment_name, attachment_type, attachment_size, author_id, author_name, is_pinned)
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $title, $content, $targetAudience, $category, 
            $attachmentUrl, $attachmentName, $attachmentType, $attachmentSize, 
            $authorId, $authorName, $isPinned
        ]);

        $newId = (int)$pdo->lastInsertId();

        $stmtGet = $pdo->prepare("SELECT * FROM school_notices WHERE id = ?");
        $stmtGet->execute([$newId]);
        $newNotice = $stmtGet->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'Notice published successfully to ' . ($targetAudience === 'student' ? 'Students Portal' : ($targetAudience === 'staff' ? 'Staff Portal' : 'All Portals')) . '.',
            'notice'  => $newNotice
        ]);
        exit;
    }

    // -------------------------------------------------------------------------
    // 4. UPDATE / EDIT NOTICE (Admin Only)
    // -------------------------------------------------------------------------
    if ($action === 'update_notice') {
        if ($userRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Permission denied. Only administrators can edit notices.']);
            exit;
        }

        $noticeId       = (int)($_POST['id'] ?? 0);
        $title          = trim($_POST['title'] ?? '');
        $content        = trim($_POST['content'] ?? '');
        $targetAudience = trim($_POST['target_audience'] ?? 'student');
        $category       = trim($_POST['category'] ?? 'official');
        $isPinned       = !empty($_POST['is_pinned']) ? 1 : 0;
        $removeAttachment = !empty($_POST['remove_attachment']) && $_POST['remove_attachment'] == '1';

        if ($noticeId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Notice ID is required.']);
            exit;
        }

        $stmtCur = $pdo->prepare("SELECT * FROM school_notices WHERE id = ?");
        $stmtCur->execute([$noticeId]);
        $existing = $stmtCur->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Notice not found.']);
            exit;
        }

        if (empty($title)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Notice title is required.']);
            exit;
        }

        if (empty($content)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Notice message content is required.']);
            exit;
        }

        if (!in_array($targetAudience, ['student', 'staff', 'all'])) {
            $targetAudience = 'student';
        }

        $validCategories = ['official', 'urgent', 'academic', 'administrative', 'event'];
        if (!in_array($category, $validCategories)) {
            $category = 'official';
        }

        $attachmentUrl  = $existing['attachment_url'];
        $attachmentName = $existing['attachment_name'];
        $attachmentType = $existing['attachment_type'];
        $attachmentSize = $existing['attachment_size'];

        // If requested to remove existing attachment
        if ($removeAttachment && !empty($existing['attachment_url'])) {
            $oldPath = __DIR__ . '/../' . $existing['attachment_url'];
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
            $attachmentUrl  = null;
            $attachmentName = null;
            $attachmentType = null;
            $attachmentSize = null;
        }

        // If new attachment uploaded
        if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['attachment'];
            $maxBytes = 25 * 1024 * 1024;
            if ($file['size'] > $maxBytes) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Attachment exceeds maximum 25MB file limit.']);
                exit;
            }

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'txt'];
            if (!in_array($ext, $allowedExts)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Unsupported attachment file format.']);
                exit;
            }

            // Remove previous file
            if (!empty($existing['attachment_url'])) {
                $oldPath = __DIR__ . '/../' . $existing['attachment_url'];
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $uploadDir = __DIR__ . '/../uploads/notices/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $uniqueName = 'notice_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
            $destination = $uploadDir . $uniqueName;

            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $attachmentUrl  = 'uploads/notices/' . $uniqueName;
                $attachmentName = $file['name'];
                $attachmentType = $ext;
                $attachmentSize = formatNoticeFileSize($file['size']);
            }
        }

        $stmtUp = $pdo->prepare("
            UPDATE school_notices 
            SET title = ?, content = ?, target_audience = ?, category = ?, 
                attachment_url = ?, attachment_name = ?, attachment_type = ?, attachment_size = ?, 
                is_pinned = ?
            WHERE id = ?
        ");
        $stmtUp->execute([
            $title, $content, $targetAudience, $category, 
            $attachmentUrl, $attachmentName, $attachmentType, $attachmentSize, 
            $isPinned, $noticeId
        ]);

        $stmtGet = $pdo->prepare("SELECT * FROM school_notices WHERE id = ?");
        $stmtGet->execute([$noticeId]);
        $updated = $stmtGet->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'Notice updated successfully.',
            'notice'  => $updated
        ]);
        exit;
    }

    // -------------------------------------------------------------------------
    // 5. DELETE NOTICE (Admin Only)
    // -------------------------------------------------------------------------
    if ($action === 'delete_notice') {
        if ($userRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Permission denied. Only administrators can delete notices.']);
            exit;
        }

        $id = (int)($_POST['id'] ?? ($_GET['id'] ?? 0));
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid notice ID.']);
            exit;
        }

        $stmtCur = $pdo->prepare("SELECT attachment_url FROM school_notices WHERE id = ?");
        $stmtCur->execute([$id]);
        $notice = $stmtCur->fetch(PDO::FETCH_ASSOC);

        if (!$notice) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Notice not found.']);
            exit;
        }

        if (!empty($notice['attachment_url'])) {
            $filePath = __DIR__ . '/../' . $notice['attachment_url'];
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }

        $stmtDel = $pdo->prepare("DELETE FROM school_notices WHERE id = ?");
        $stmtDel->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => 'Notice deleted successfully.'
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Unknown action: ' . htmlspecialchars($action)]);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    exit;
}

