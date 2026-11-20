<?php
// ===== НАСТРОЙКА: куда приходят заявки =====
$TO   = 'agk_is@mail.ru';      // ваш ящик для заявок
$FROM = 'noreply@example.ru';   // ящик на домене сайта (создайте в панели Timeweb → Почта)
// ===========================================

header('X-Content-Type-Options: nosniff');
$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function done($ok, $json) {
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['ok' => $ok]);
    } else {
        $back = 'contacts.html';
        if (!empty($_SERVER['HTTP_REFERER'])) {
            $p = parse_url($_SERVER['HTTP_REFERER']);
            if (($p['host'] ?? '') === ($_SERVER['HTTP_HOST'] ?? '')) $back = ltrim($p['path'] ?? '/', '/') ?: 'index.html';
        }
        header('Location: /' . $back . '?sent=' . ($ok ? '1' : '0') . '#zayavka', true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') done(false, $wantsJson);
if (!empty($_POST['website'])) done(true, $wantsJson); // бот: делаем вид, что всё ок

$clean = fn($v, $n) => mb_substr(trim(str_replace(["\r", "\0"], '', (string)($v ?? ''))), 0, $n);
$name    = $clean($_POST['name'] ?? '', 100);
$phone   = $clean($_POST['phone'] ?? '', 30);
$message = $clean($_POST['message'] ?? '', 2000);

if (strlen(preg_replace('/\D/', '', $phone)) < 10) done(false, $wantsJson);

$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта ИНЖХАУС') . '?=';
$body = "Имя: " . ($name ?: '—') . "\nТелефон: $phone\n\nОбъект и системы:\n" . ($message ?: '—')
      . "\n\n---\nIP: " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\nВремя: " . date('d.m.Y H:i');
$headers = "From: $FROM\r\nReply-To: $FROM\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";

done(mail($TO, $subject, $body, $headers, "-f$FROM"), $wantsJson);
