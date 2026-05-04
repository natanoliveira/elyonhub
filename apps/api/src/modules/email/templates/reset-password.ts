export function resetPasswordTemplate(name: string, link: string) {
  const subject = 'Redefinição de senha — Elyon Hub'

  const bodyText = `
Olá ${name},

Recebemos uma solicitação para redefinir a senha da sua conta no Elyon Hub.

Clique no link abaixo para criar uma nova senha:

${link}

Este link expira em 1 hora.

Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.

— Equipe Elyon Hub
  `.trim()

  const bodyHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1f0d35;padding:32px 40px;text-align:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">Elyon Hub</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">Redefinição de senha</h1>
              <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">Olá <strong>${name}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:8px;background:#6d28d9;">
                    <a href="${link}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
                Ou copie e cole este link no navegador:<br/>
                <a href="${link}" style="color:#6d28d9;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #eee;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#aaa;">Este link expira em <strong>1 hora</strong>.</p>
              <p style="margin:0;font-size:12px;color:#aaa;">Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, bodyText, bodyHtml }
}
