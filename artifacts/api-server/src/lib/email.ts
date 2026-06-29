import { Resend } from "resend";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const _dir = dirname(fileURLToPath(import.meta.url));
const _logoPath = join(_dir, "../../../artifacts/bank-mondial/public/logo-banque-mondiale.png");
let _logoDataUri: string;
try {
  const _logoB64 = readFileSync(_logoPath).toString("base64");
  _logoDataUri = `data:image/png;base64,${_logoB64}`;
} catch {
  _logoDataUri = "";
}

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set — email sending is disabled");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/** Escape user-controlled strings before embedding them in HTML email bodies. */
function esc(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const FROM = process.env.EMAIL_FROM ?? "Banque Mondiale <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN ?? "localhost:5000"}`;

// ─── Shared HTML helpers ─────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Banque Mondiale</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#003087;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="${_logoDataUri}" alt="Banque Mondiale"
                      width="44" height="44"
                      style="border-radius:10px;background:#fff;padding:4px;display:inline-block;vertical-align:middle;" />
                    <span style="display:inline-block;vertical-align:middle;margin-left:12px;">
                      <span style="display:block;color:#ffffff;font-size:15px;font-weight:900;letter-spacing:2px;text-transform:uppercase;line-height:1.2;">Banque Mondiale</span>
                      <span style="display:block;color:rgba(255,255,255,0.55);font-size:10px;letter-spacing:1px;">Transaction sécurisée · SSL 256-bit</span>
                    </span>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="background:rgba(255,255,255,0.12);border-radius:20px;padding:4px 12px;color:#86efac;font-size:11px;font-weight:700;">✔ Sécurisé</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#64748b;">
                Banque Mondiale — Votre banque de confiance
              </p>
              <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">
                Pour toute question, contactez notre service client.
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © 2023–${new Date().getFullYear()} Banque Mondiale · Tous droits réservés
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailsBlock(rows: { label: string; value: string }[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0"
    style="border-left:4px solid #003087;background:#f8fafc;border-radius:0 8px 8px 0;margin:0;padding:0;">
    ${rows.map(r => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:12px;color:#64748b;font-weight:700;display:block;">${r.label}</span>
        <span style="font-size:13px;color:#1e293b;font-weight:600;">${r.value}</span>
      </td>
    </tr>`).join("")}
  </table>`;
}

function statusBanner(text: string, color: string, bg: string): string {
  return `<div style="background:${bg};border-left:4px solid ${color};border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px;">
    <span style="color:${color};font-size:13px;font-weight:800;">${text}</span>
  </div>`;
}

// ─── 1. Welcome email ────────────────────────────────────────────────────────

export async function sendWelcomeEmail(opts: {
  to: string;
  fullName: string;
  email: string;
  clientId: string;
  iban: string;
  currency: string;
}) {
  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#1e293b;">Bonjour <strong>${esc(opts.fullName)}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;">
      Nous sommes ravis de vous accueillir à la <strong>Banque Mondiale</strong>. Votre compte a été créé avec succès et est déjà actif.
    </p>

    ${statusBanner("✔ Compte activé et opérationnel", "#16a34a", "#f0fdf4")}

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Détails de votre compte</p>
    ${detailsBlock([
      { label: "Titulaire", value: esc(opts.fullName) },
      { label: "Email", value: esc(opts.email) },
      { label: "Identifiant client", value: esc(opts.clientId) },
      { label: "IBAN", value: esc(opts.iban) },
      { label: "Devise", value: esc(opts.currency) },
    ])}

    <p style="margin:24px 0 8px;font-size:13px;color:#475569;line-height:1.6;">
      Vous pouvez dès à présent accéder à votre espace personnel pour consulter votre solde, effectuer des virements et gérer votre compte en toute sécurité.
    </p>
    <p style="margin:0 0 24px;font-size:13px;color:#475569;">
      Si vous n'êtes pas à l'origine de cette inscription, veuillez contacter notre service client immédiatement.
    </p>

    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
      Traité par : <strong style="color:#003087;">Banque Mondiale</strong>
    </p>
  `;

  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: "Bienvenue à la Banque Mondiale — Votre compte est actif",
    html: layout(body),
  });
}

// ─── 2. Transfer notification (receiver) ─────────────────────────────────────

export async function sendTransferNotificationEmail(opts: {
  to: string;
  receiverName: string;
  senderName: string;
  amount: number;
  currency: string;
  displayCurrency?: string;
  reference: string;
  originAccount?: string;
  destinationAccount?: string;
  linkUrl: string;
  message?: string | null;
}) {
  const amtStr = opts.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  const currLabel = opts.displayCurrency && opts.displayCurrency !== "EUR"
    ? `${opts.displayCurrency} (≈ ${amtStr} EUR)`
    : `${amtStr} ${opts.currency}`;

  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#1e293b;">Bonjour <strong>${esc(opts.receiverName)}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;">
      <strong>Votre demande de virement a été acceptée</strong> et est en attente de votre confirmation.
    </p>

    ${statusBanner("Auto-traité par le Système Banque Mondiale (APPROUVÉ)", "#16a34a", "#f0fdf4")}

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Détails de la transaction</p>
    ${detailsBlock([
      ...(opts.originAccount ? [{ label: "Compte d'origine", value: esc(opts.originAccount) }] : []),
      ...(opts.destinationAccount ? [{ label: "Compte destinataire", value: esc(opts.destinationAccount) }] : []),
      { label: "Expéditeur", value: esc(opts.senderName) },
      { label: "Bénéficiaire", value: esc(opts.receiverName) },
      { label: "Montant reçu (Crédit)", value: esc(currLabel) },
      { label: "Frais", value: "0 EUR" },
      { label: "Taxes", value: "0 EUR" },
      { label: "Référence de transaction", value: esc(opts.reference) },
      ...(opts.message ? [{ label: "Message", value: esc(opts.message) }] : []),
    ])}

    <p style="margin:24px 0 12px;font-size:13px;color:#475569;">
      Pour confirmer la réception de ce virement, cliquez sur le bouton ci-dessous :
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${opts.linkUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#003087,#0050c8);color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
        Confirmer la réception du virement
      </a>
    </div>

    <p style="margin:0 0 0;font-size:12px;color:#94a3b8;text-align:center;">
      Traité par : <strong style="color:#003087;">Banque Mondiale</strong>
    </p>
  `;

  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Virement de ${currLabel} reçu — Confirmation requise`,
    html: layout(body),
  });
}

// ─── 3. Transfer confirmed by user ───────────────────────────────────────────

export async function sendTransferConfirmedEmail(opts: {
  to: string;
  receiverName: string;
  senderName: string;
  amount: number;
  currency: string;
  displayCurrency?: string;
  reference: string;
  confirmedAt: string;
  originAccount?: string;
  destinationAccount?: string;
}) {
  const amtStr = opts.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  const currLabel = opts.displayCurrency && opts.displayCurrency !== "EUR"
    ? `${opts.displayCurrency} (≈ ${amtStr} EUR)`
    : `${amtStr} ${opts.currency}`;

  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#1e293b;">Bonjour <strong>${esc(opts.receiverName)}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;">
      Vous venez de <strong>confirmer la réception</strong> de votre virement. Voici le récapitulatif complet de votre transaction.
    </p>

    ${statusBanner("✔ Réception confirmée — Virement traité avec succès", "#16a34a", "#f0fdf4")}

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Récapitulatif de la transaction</p>
    ${detailsBlock([
      ...(opts.originAccount ? [{ label: "Compte d'origine", value: esc(opts.originAccount) }] : []),
      ...(opts.destinationAccount ? [{ label: "Compte destinataire", value: esc(opts.destinationAccount) }] : []),
      { label: "Expéditeur", value: esc(opts.senderName) },
      { label: "Bénéficiaire", value: esc(opts.receiverName) },
      { label: "Montant reçu (Crédit)", value: esc(currLabel) },
      { label: "Frais", value: "0 EUR" },
      { label: "Taxes", value: "0 EUR" },
      { label: "Confirmé le", value: esc(opts.confirmedAt) },
      { label: "Référence de transaction", value: esc(opts.reference) },
    ])}

    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
      Traité par : <strong style="color:#003087;">Banque Mondiale</strong>
    </p>
  `;

  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Confirmation de réception — ${currLabel}`,
    html: layout(body),
  });
}

// ─── 4. Withdrawal suspended ─────────────────────────────────────────────────

export async function sendWithdrawalSuspendedEmail(opts: {
  to: string;
  receiverName: string;
  senderName: string;
  amount: number;
  currency: string;
  displayCurrency?: string;
  reference: string;
  blockReason?: string | null;
  originAccount?: string;
  destinationAccount?: string;
  whatsappNumber?: string | null;
}) {
  const amtStr = opts.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  const currLabel = opts.displayCurrency && opts.displayCurrency !== "EUR"
    ? `${opts.displayCurrency} (≈ ${amtStr} EUR)`
    : `${amtStr} ${opts.currency}`;

  const waNumber = opts.whatsappNumber ? opts.whatsappNumber.replace(/\D/g, "") : null;
  const waMessage = encodeURIComponent(
    `Bonjour, je souhaite débloquer mon retrait de ${amtStr} ${opts.currency} (réf. ${opts.reference}).`
  );
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : null;

  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#1e293b;">Bonjour <strong>${esc(opts.receiverName)}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;">
      Votre demande de <strong>retrait de fonds</strong> a été <strong>temporairement suspendue</strong>. Notre équipe examine votre dossier.
    </p>

    ${statusBanner("⚠ Retrait suspendu — En cours d'examen", "#b45309", "#fffbeb")}

    ${opts.blockReason ? `
    <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px;">
      <span style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:4px;">Raison du blocage</span>
      <span style="font-size:13px;color:#7f1d1d;">${esc(opts.blockReason)}</span>
    </div>` : ""}

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Informations de la transaction</p>
    ${detailsBlock([
      ...(opts.originAccount ? [{ label: "Compte d'origine", value: esc(opts.originAccount) }] : []),
      ...(opts.destinationAccount ? [{ label: "Compte destinataire", value: esc(opts.destinationAccount) }] : []),
      { label: "Expéditeur", value: esc(opts.senderName) },
      { label: "Bénéficiaire", value: esc(opts.receiverName) },
      { label: "Montant (Crédit)", value: esc(currLabel) },
      { label: "Frais", value: "0 EUR" },
      { label: "Taxes", value: "0 EUR" },
      { label: "Référence de transaction", value: esc(opts.reference) },
    ])}

    <p style="margin:24px 0 12px;font-size:13px;color:#475569;line-height:1.6;">
      Un conseiller de la Banque Mondiale va examiner votre dossier dans les plus brefs délais et vous contactera pour débloquer vos fonds.
    </p>

    ${waUrl ? `
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${waUrl}"
        style="display:inline-block;background:#25D366;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
        💬 Contacter le support WhatsApp
      </a>
      <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">Appuyez pour ouvrir WhatsApp et débloquer votre retrait</p>
    </div>` : ""}

    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
      Traité par : <strong style="color:#003087;">Banque Mondiale</strong>
    </p>
  `;

  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Retrait suspendu — ${currLabel} · Réf. ${opts.reference}`,
    html: layout(body),
  });
}
