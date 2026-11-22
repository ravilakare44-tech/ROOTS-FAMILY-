import React, { useState } from 'react';
import { Check, CheckCircle2, Copy } from 'lucide-react';
import supabaseSchemaSql from '../../supabase/schema.sql?raw';
import { BRAND_CONFIG } from '../config/brand.ts';
import { useApp } from '../context/AppContext.tsx';

export function PrivacyPage() {
  const { user, navigate } = useApp();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-[#B08D57] bg-[#FAF3E6] p-4 text-xs leading-relaxed text-[#6B4F24]">
        <strong>Draft Policy Notice:</strong> This privacy policy is a draft prepared for product
        review and must be reviewed by legal counsel before accepting real customer or family data.
        In addition, this preview runs in Local Demo Mode—do not submit real sensitive records.
      </div>

      <h1 className="mt-6 font-display text-3xl font-semibold text-[#1B4332]">
        Privacy Policy (Draft)
      </h1>
      <p className="mt-2 text-sm text-[#5E6660]">Last updated: November 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#3A413C]">
        <section>
          <h2 className="font-display text-xl font-semibold text-[#1F2421]">
            1. What information we collect
          </h2>
          <p className="mt-2">
            When you create a family tree or contribute through an invite link, {BRAND_CONFIG.name}{' '}
            collects only the details you choose to enter: owner name and email, family member names,
            optional alternate/maiden names, birth and death dates (including approximate or unknown
            markers), relationships, notes, and optional portrait photos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[#1F2421]">
            2. Why we collect it &amp; who can see it
          </h2>
          <p className="mt-2">
            We use this information solely to help you organize, preview, and export your family tree.
            Family trees are private by default and are never listed in public search directories.
            Private contributor links grant access only to the submission form for that single tree
            and never reveal the owner dashboard or other family records.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[#1F2421]">
            3. Optional photo enhancement &amp; analytics
          </h2>
          <p className="mt-2">
            No third-party analytics or ad tracking scripts are active by default. Family photos are
            never sent to an AI service automatically—only if you explicitly click the optional
            “Enhance photo” action inside the photo editor.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[#1F2421]">
            4. Corrections &amp; deleting trees or photos
          </h2>
          <p className="mt-2">
            Tree owners can edit or remove any person, delete an entire tree from the Owner
            Dashboard, or request deletion of stored photos. For assistance or deletion requests,
            contact{' '}
            <span className="font-medium text-[#1B4332]">{BRAND_CONFIG.supportEmail}</span>.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-xs font-medium text-[#1B4332] hover:bg-[#F2EDE2] cursor-pointer"
            >
              {user ? 'Manage or delete trees in Dashboard' : 'Sign in to manage your trees'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-[#B08D57] bg-[#FAF3E6] p-4 text-xs leading-relaxed text-[#6B4F24]">
        <strong>Draft Terms Notice:</strong> These terms are a draft placeholder requiring legal
        review before commercial launch.
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-[#1B4332]">
        Terms of Service (Draft)
      </h1>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-[#3A413C]">
        <p>
          <strong>Your family records belong to you:</strong> You retain full ownership of names,
          dates, notes, and photographs you add to {BRAND_CONFIG.name}. You confirm you have
          permission to share details and portraits of living relatives you add or invite others to
          submit.
        </p>
        <p>
          <strong>Acceptable use:</strong> Do not upload unlawful content or attempt to access
          another family’s private tree or invite link.
        </p>
        <p>
          <strong>Demo preview status:</strong> In this preview build, payments are simulated in demo
          mode with no real charges, and data is stored temporarily for evaluation.
        </p>
      </div>
    </div>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[#1B4332]">Contact us</h1>
      <p className="mt-2 text-sm text-[#3A413C]">
        Questions about building a family tree, deleting photos, or regional language support? Email{' '}
        <span className="font-medium text-[#1B4332]">{BRAND_CONFIG.supportEmail}</span> or leave a
        preview note below.
      </p>

      <div className="mt-6 rounded-2xl border border-[#DCD4BE] bg-white p-6">
        {sent ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[#1B4332]" />
            <h2 className="mt-3 font-display text-xl font-semibold text-[#1F2421]">
              Preview note recorded locally
            </h2>
            <p className="mt-1.5 text-sm text-[#5E6660]">
              Email delivery is not wired in this demo build. Please reach out directly once
              production support email is configured.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-[#1F2421]">
                Your name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-[#1F2421]">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="contact-msg" className="block text-sm font-medium text-[#1F2421]">
                Message
              </label>
              <textarea
                id="contact-msg"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3.5 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="min-h-[42px] rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
            >
              Send message (preview)
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function HelpPage() {
  const { navigate, user } = useApp();
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(supabaseSchemaSql);
      setCopiedSql(true);
      window.setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback selection handled via textarea if clipboard permission is denied
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[#1B4332]">Help &amp; Guide</h1>
      <p className="mt-2 text-sm text-[#3A413C]">
        A quick walkthrough of creating, collaborating on, and exporting a family tree.
      </p>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-[#DCD4BE] bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-[#1F2421]">
            1. Building your tree in the editor
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3A413C]">
            Sign in from the Owner Account page, create a tree (or open the fictional Kulkarni &amp;
            Rao sample), and use “Add person” to enter names, dates (exact, approximate, year-only,
            or unknown), notes, and cropped photos. Select any person to connect parents, children,
            up to 4 spouses/partners, or custom labeled relationships.
          </p>
        </div>

        <div className="rounded-xl border border-[#DCD4BE] bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-[#1F2421]">
            2. Inviting relatives safely
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3A413C]">
            Click “Invite family” inside the editor to copy a private unguessable link. You can
            disable or regenerate that link anytime. Relatives do not need an account—their
            submissions wait in your Review Inbox until you edit, link, approve, or reject them.
          </p>
        </div>

        <div className="rounded-xl border border-[#DCD4BE] bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-[#1F2421]">
            3. Styling &amp; downloading
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3A413C]">
            Open “Preview &amp; Download” to switch between Classic, Portrait, Landscape, upward
            Green Tree, and Photo Cards, pick readable fonts and colors, download a PNG image, or
            save a PDF via your browser’s print sheet.
          </p>
        </div>

        <div className="rounded-xl border border-[#DCD4BE] bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#1F2421]">
                4. Supabase SQL schema setup
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#5E6660]">
                Copy this SQL script and run it once in your Supabase Dashboard → SQL Editor to
                create the family tree tables.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
            >
              {copiedSql ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedSql ? 'Copied SQL' : 'Copy SQL'}</span>
            </button>
          </div>
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] p-3.5 text-xs leading-relaxed text-[#1F2421]">
            <code>{supabaseSchemaSql}</code>
          </pre>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => navigate(user ? '/dashboard' : '/auth')}
          className="min-h-[42px] rounded-lg bg-[#1B4332] px-5 py-2.5 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
        >
          {user ? 'Go to dashboard' : 'Sign in to try the editor'}
        </button>
      </div>
    </div>
  );
}
