<?php
// Root entrypoint on Render backend: redirect visitors to the frontend single-page application
$frontendEnv = trim((string)(getenv('FRONTEND_ORIGIN') ?: ''));
if (!empty($frontendEnv)) {
    $origins = array_map('trim', explode(',', $frontendEnv));
    $target = rtrim($origins[0], '/');
} else {
    $target = 'https://years-frontend-amber.vercel.app';
}

$queryString = !empty($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : '';
header("Location: " . $target . $queryString, true, 302);
exit;
