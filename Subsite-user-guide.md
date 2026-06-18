# Paléo Dedicated Site — User Guide

> **Who is this document for?**
> The owners of a thematic dedicated site within the Paléo ecosystem, and the people who support them. It describes **everything** you can see and do on a dedicated site: the public pages, the admin area, the options, the automatic behaviours, and step-by-step recipes for common tasks.
>
> No technical skills are required. Everything is done from the website, in your browser.

---

## Table of contents

1. [Key vocabulary](#1-key-vocabulary)
2. [Understanding what a dedicated site is](#2-understanding-what-a-dedicated-site-is)
3. [Roles: who can do what](#3-roles-who-can-do-what)
4. [Signing in and finding your way around](#4-signing-in-and-finding-your-way-around)
5. [The public pages (visitor view)](#5-the-public-pages-visitor-view)
6. [Languages & translations (FR/EN)](#6-languages--translations-fren)
7. [Submitting a cartel (visitors and admins)](#7-submitting-a-cartel-visitors-and-admins)
8. [Editing your dedicated site's home page](#8-editing-your-dedicated-sites-home-page)
9. [Managing the "About" team](#9-managing-the-about-team)
10. [Managing cartels (moderation)](#10-managing-cartels-moderation)
11. [The "submit to the main site" workflow](#11-the-submit-to-the-main-site-workflow)
12. [Step-by-step recipes](#12-step-by-step-recipes)
13. [Things to watch out for](#13-things-to-watch-out-for)
14. [FAQ](#14-faq)
- [Glossary](#glossary)

---

## 1. Key vocabulary

- **Cartel**: the record for an object / invention (title, year, location, image, description, categories…). It is the basic unit shown on the timeline.
- **Timeline (Frise)**: the collection of your dedicated site's published cartels, shown as a chronology. Three display modes exist: **Timeline** (chronology), **Map** (geographic) and **Tree** (Arborescence).
- **Cartel status**: its state in the life cycle.
  - **Draft** (unpublished idea, hidden from the public)
  - **Pending** (a visitor's submission, awaiting moderation)
  - **Published** (visible to the public)
  - **Archived** (kept but hidden from the public, reversible)
- **Slug**: the "address" part of a dedicated site (e.g. `paleo-h2o` in `…/site/paleo-h2o`).
- **Owner**: the person allowed to administer *one* specific dedicated site (yours).
- **Superadmin / General administrator**: the person who manages the entire platform and all dedicated sites.
- **Submit to the main site**: propose that a cartel published on your dedicated site also appears on the main site (after the general administrator's approval).

---

## 2. Understanding what a dedicated site is

A **dedicated site** is a standalone thematic mini-site orbiting the main site (Paléo-Énergétique). It has:

- its own customisable **home page**,
- its own signature **colour** (applied everywhere: menu, buttons, accents…),
- its own **timeline** of cartels (the collection of inventions/objects you showcase),
- its own **Partners** page and its own **"About" team** page,
- optionally its **own domain name** (e.g. `paleo-h2o.org`).

A dedicated site stays connected to the main site: some of your cartels can, if you wish, be **proposed to also appear on the main site** (see [chapter 11](#11-the-submit-to-the-main-site-workflow)).

**Two ways a dedicated site's timeline is fed** (chosen at creation time, by the general administrator):

| Source type | How cartels end up in the dedicated site |
|---|---|
| **"Category" source** | The cartels are those **explicitly attached** to the dedicated site. You decide, one by one, which cartels appear there: you build the selection by hand. |
| **"Workshop" source** | The cartels are **all those attached to a given workshop** (a workshop is a group of cartels). The list updates **on its own**: adding or removing a cartel from the workshop adds or removes it from the dedicated site right away. |

> 📸 **[Screenshot S01]** — Overview of a dedicated site (home page shown in the browser, with the URL visible in the address bar).

> ⚠️ **Keep in mind:** the **source type** (category or workshop), the **name** and the **slug** (the address) of the dedicated site are set at creation by the general administrator and **can no longer be changed afterwards**. As an owner, you manage the content, not the technical identity.

---

## 3. Roles: who can do what

| Action | Visitor (not signed in) | **Owner (you)** | General administrator |
|---|:---:|:---:|:---:|
| View the public pages | ✅ | ✅ | ✅ |
| Submit a cartel | ✅ *(goes "pending")* | ✅ *(publishes directly)* | ✅ |
| Edit the home page (colour, content, partners) | ❌ | ✅ | ✅ |
| Change the **name**, the **slug**, the **source** of the dedicated site | ❌ | ❌ | ✅ |
| Manage the "About" team | ❌ | ✅ | ✅ |
| Create / edit / publish / archive / delete the dedicated site's cartels | ❌ | ✅ | ✅ |
| Submit a cartel to the main site | ❌ | ✅ *(its published cartels)* | ✅ |
| **Approve / reject** submissions to the main site | ❌ | ❌ | ✅ |
| View/edit another dedicated site's cartels | ❌ | ❌ | ✅ |
| Edit the main site's cartels | ❌ | ❌ *(view only)* | ✅ |

> 💡 User accounts (creating a new owner, passwords…) are managed by the **general administrator**. If you need access for a collaborator, ask them.

> ⚠️ **Sharing access — important.** Your login credentials are **strictly personal** and reserved for members of **your organisation**. Sharing them is done **entirely at your own risk**, and it is **strictly forbidden** to give them to anyone **outside your organisation** (see the legal notice).

---

## 4. Signing in and finding your way around

### 4.1 Signing in

1. On any page of your dedicated site, click **"Sign in"** ("Se connecter") in the top right.
2. Enter your **email** and your **password**.
3. Click **"Sign in"**.

> 📸 **[Screenshot S02]** — The sign-in window open.

Once signed in, extra buttons appear in the top bar.

### 4.2 The top bar (header)

From left to right:

- **Dedicated site name** (clickable → back to home).
- **Navigation menu**: *Home · Timeline · Presentation · Partners*.
- **Language switcher** (French / English) — see [chapter 6](#6-languages--translations-fren).
- **"Submit a cartel"** — visible to **everyone**.
- **"Home page"** — *(signed in as owner)* edit the home content, the colour, the partners.
- **"Team"** — *(owner)* manage the members of the "About" page.
- **"Manage"** — *(owner)* manage the cartels (moderation).
- **Sign-out icon**.

> 📸 **[Screenshot S03]** — The top bar **as seen when signed in as an owner**, with the "Submit a cartel", "Home page", "Team", "Manage" buttons clearly visible.

> 💡 **Visual cue:** a breadcrumb trail appears at the top of deep pages so you know where you are and can step back.

---

## 5. The public pages (visitor view)

This is what any visitor sees. Get familiar with these pages: they are the ones your content feeds.

### 5.1 Home

- A **hero banner** with the dedicated site name, the theme, and an **"Explore the timeline"** button.
- Below it, your free **content blocks** (text, images, quotes, buttons…), which you compose yourself (see [chapter 8](#8-editing-your-dedicated-sites-home-page)).

> 📸 **[Screenshot S04]** — Full dedicated site home page (banner + a few content blocks).

### 5.2 Timeline / Map / Tree

The same collection of cartels, from three angles:

- **Timeline**: chronology (by year).
- **Map**: geographic distribution (based on the locations entered in the cartels).
- **Tree**: structured view by grouping.

The visitor can filter, search, and click a cartel to open its detailed record.

> 📸 **[Screenshot S05]** — A dedicated site's timeline with several cartels.
> 📸 **[Screenshot S06]** — The same content in **Map** mode.

### 5.3 Presentation (the "About" page)

The **"Presentation"** menu link opens **your dedicated site's** "About" page: it shows the **team** you manage (see [chapter 9](#9-managing-the-about-team)), split into Main / Secondary / Community. If your dedicated site has no members declared, the page automatically falls back to the main site's team.

> 💡 The footer also offers **Legal notice**, **Privacy policy** and **Contact**: these pages are **shared across the whole ecosystem** (main site). They open correctly, including from a dedicated site on its own domain name.

### 5.4 Partners

A list of the partners associated with your dedicated site, split into **Main partners** (shown first) and **Partners**. Each partner shows its logo (or its initial) and a link to its website if provided. *(You choose these partners from the home page editor — see [§8.4](#84-partners).)*

> 📸 **[Screenshot S07]** — A dedicated site's Partners page.

### 5.5 A cartel's detailed record

By clicking a cartel, the visitor opens its full record: image, description, location, year, credits, and optionally a **"Learn more"** button (to an external link or a richer internal page). A **QR code** pointing to this record can be generated when printing.

> 📸 **[Screenshot S08]** — A cartel's detailed record.

---

## 6. Languages & translations (FR/EN)

The site is **bilingual French / English**. Understanding how languages and translation work will save you surprises.

### 6.1 The language switcher (visitors)

In the top right, two **FR / EN** buttons. The choice is **stored in the visitor's browser** (they get it back on their next visit). Switching language changes both the **interface** (menus, buttons, labels) and the **content of the cartels** into the chosen language.

> 📸 **[Screenshot S19]** — The FR / EN switcher in the top bar.

### 6.2 How bilingual content is stored

Each **cartel** has two versions of its key texts: **title, description and location**, in French and in English. Likewise, each **team member** has a **Role (EN)** and a **Bio (EN)**.

> 💡 **Fallback rule:** if a visitor is in English but the EN version of a field is empty, the **French text is shown** (never a blank). So nothing "breaks" if a translation is missing — but an English-speaking visitor then sees French at that spot.

### 6.3 What gets translated… and what does not

| Element | Translated FR/EN? |
|---|---|
| Interface (menus, buttons, labels) | ✅ Yes, automatically |
| Cartels: **title, description, location** | ✅ Yes (a FR field + an EN field) |
| "About" team: **role, bio** | ✅ Yes (dedicated EN fields) |
| A team member's **name** | ❌ No (a single name) |
| **Home page blocks** (titles, texts, quotes…) | ✅ Yes (**French / English** tab in the editor — falls back to FR if EN is empty) |
| Dedicated site **name / theme** | ❌ No |

> 💡 **The home page is bilingual.** In the home page editor, a **French / English** switcher lets you compose a separate English version of the blocks (see [§8.2](#82-the-content-the-block-editor)). If you leave the English version empty, English-speaking visitors automatically see the French version.

### 6.4 Automatic translation (admins only)

Several AI tools help you fill in the English version. **A visitor not signed in never has access to them.**

- **When creating a cartel**: if you fill in the French and leave the English empty, the English is **generated automatically** (and vice versa). *(Only on creation, not on every edit.)*
- **Per-cartel "Translate" button** (the "Manage" screen): (re)translates a cartel into the other language on demand.
- **Re-translate in bulk**: select several cartels → everything is re-translated at once.
- **Team**: a **Translate** button in a member's form pre-fills *Role (EN)* and *Bio (EN)* from the French.

> 💡 A **language detection** as you type warns you if you type English in the French field (or vice versa) and offers to switch.

### 6.5 Spotting cartels with no English version

In the **"Manage"** screen, a cartel without an English translation shows a small orange **"No EN translation"** badge. Use the **Translate** button to fill the gap.

### 6.6 Exporting a translated PDF (in any language)

In **Manage → Export → "Translated PDF (other language)"**, you can generate a PDF of the cartels in **a language of your choice** — not just English: Spanish, German, Italian, Japanese, etc.

- You type the **target language** (a free field, with common suggestions).
- The AI translates the content **from the currently displayed language** (FR or EN) then generates the PDF.
- ⚠️ This is a **one-off export**: the translation is only used for the PDF, it is **not saved** in the database. Ideal for a multilingual exhibition.

> ⚠️ **Always proofread** automatic translations before distribution (especially bios and descriptions). The AI is an excellent starting point, not an infallible translator.

---

## 7. Submitting a cartel (visitors and admins)

The **"Submit a cartel"** button opens the creation form. **The behaviour depends on who you are.**

### 7.1 The form fields (in order)

| Field | Required | Detail |
|---|:---:|---|
| **Title** | ✅ | The name of the object / invention. A language check warns you if you type in the "wrong" language. |
| **Year of the invention** | ❌ | E.g. `2024` or `2024-01-15`. |
| **Unearthed by** | ❌ | Credits the person who found/identified the object. |
| **Location (City, Country)** | ❌ | E.g. `Paris, France`. A 📍 button geolocates automatically (a pin on the map). ✓ green if found, ✗ red if not found. |
| **Description** | ❌ | Up to **1500 characters** (spaces included). **Bold** / **Italic** buttons. A counter shows `n / 1500`. |
| **Image** | ❌ | Automatically compressed, from any image format, and previewed instantly. |
| **Image credit** | ❌ | E.g. `Wikimedia Commons, Unknown author…`. |
| **Categories** | ❌ | Click the categories that apply; you can create a new one. |
| **Workshops** | ❌ *(admins)* | Internal tags, **hidden** on the timeline and in printing. |
| **Link for QR Code** | ❌ | External link shown by the "Learn more" button and encoded in the QR code. |
| **Internal "Learn more" page** | ❌ *(admins)* | If ticked, opens a block editor to build a rich internal page instead of an external link. |
| **Internal admin notes** | — *(admins, when editing)* | Internal exchanges between administrators, never public. |
| **Contact** | ❌ | Email or phone, **stored in the database** so you can be reached about the cartel (clarifications, sources). **Never shown publicly.** Signed in: leave empty if you are the author — your **account email** is then used; fill it in if you're entering the cartel on someone else's behalf. |

> 📸 **[Screenshot S09]** — The "Submit a cartel" form filled in, seen **as an owner** (Workshops and internal page fields visible).
> 📸 **[Screenshot S10]** — The same form **seen by a visitor not signed in** (admin fields absent).

### 7.2 Differences by role

- **Visitor not signed in:** a single **"Send the proposal"** button. The cartel goes **"pending"**: it is not published until an administrator validates it. A window suggests (without forcing) leaving a contact email. *(No automatic translation for visitors.)*
- **Owner / admin:** two buttons — **"Save draft"** (*Draft* status, hidden) and **"Publish"** (*Published* status, visible immediately). On creation, an **automatic translation** to the other language is attempted for the fields left empty (see [§6.4](#64-automatic-translation-admins-only)).

> ⚠️ **Safety net:** if you leave the page with unsaved changes, a confirmation message warns you ("Leave without publishing?").

### 7.3 Creating vs editing

- **Creating**: blank form, titled "New cartel".
- **Editing**: pre-filled form, titled "Edit cartel". **Internal notes** only appear when editing. You edit a cartel from the **"Manage"** screen (see [chapter 10](#10-managing-cartels-moderation)).

---

## 8. Editing your dedicated site's home page

Click **"Home page"** in the top bar. An editing window opens.

> ⚠️ **Changes are published immediately** as soon as you save (no draft for the home page).

As an owner, you can edit **three things**: the **colour**, the **content** (blocks) and the **partners**. *(The name, slug and source can only be changed by the general administrator and therefore do not appear here.)*

> 📸 **[Screenshot S11]** — The home page editing window, open (owner view: Colour, Content, Partners sections).

### 8.1 The colour

Choose the signature colour with the picker, or type its code (e.g. `#4A90D9`). It applies everywhere on the dedicated site (active menu, buttons, accents, block titles…).

### 8.2 The content: the block editor

The home page is composed by stacking **blocks**. At the bottom of the section, click the button for the block type you want to add it to the end. Here are the **9 available types**:

| Block | What it's for | Options |
|---|---|---|
| **Title** | A section heading. | H1 / H2 / H3 level + text. |
| **Text** | A paragraph. | Multi-line text area (line breaks are preserved). |
| **Image** | An image with caption. | URL **or** an *Upload* button + optional caption. |
| **Video** | A video. | YouTube / Vimeo / `.mp4` file URL + caption. |
| **Gallery** | Several images in a grid. | Add via *URL* or *Upload*, caption per image, delete per image. |
| **Quote** | A highlighted quote. | Text + optional attribution. |
| **Button** | A call-to-action button. | Label + **Solid** or **Outline** style + destination URL. |
| **Separator** | A dividing line. | No options. |
| **Embed** | Embed external content (PDF, Sketchfab, Google Maps…). | iframe URL + caption + height in pixels (150–1200). |

**Working with blocks:**
- **Add**: click the button for the desired type (at the bottom).
- **Reorder**: **▲ / ▼** arrows to the left of each block. *(No drag-and-drop.)*
- **Delete**: the **red trash** icon to the right of the block (immediate deletion, but nothing is saved until you confirm the window).
- **English version**: at the top of the section, a **French / English** switcher (the number of blocks for each language is shown in parentheses). Compose the FR blocks under the *French* tab and, if you wish, a separate English version under the *English* tab. English-speaking visitors see the English version; **if it is empty, they automatically see the French version** (no risk of a blank page).

> 📸 **[Screenshot S12]** — The block editor with a few blocks (a Title, a Text, an Image), showing the ▲▼ arrows and the trash icon.
> 📸 **[Screenshot S13]** — The row of the 9 block-adding buttons.

> 💡 Your dedicated site's colour automatically tints titles, quotes, buttons and separators. **There is no live preview** in the editor: save, then check the result on the home page.

> 💡 Blocks have **no** automatic AI translation: the English version is entered by hand under the *English* tab (see [§6.3](#63-what-gets-translated-and-what-does-not)).

### 8.3 Uploading images inside blocks

For the **Image** and **Gallery** blocks, the *Upload* button opens your file explorer; the image is uploaded and its link inserted automatically. During upload, the button shows "…".

### 8.4 Partners

Select your dedicated site's partners by clicking their names, split into two groups:
- **Main partners** (shown first at the top of the Partners page).
- **Partners** (standard group).

A partner can only be in one group at a time. *(The partner catalogue itself is managed at the platform level.)*

### 8.5 Save

Click the confirm button at the bottom of the window. Changes are **published immediately**.

---

## 9. Managing the "About" team

Click **"Team"** in the top bar. This page manages the people shown on your dedicated site's public **"About"** page.

> ⚠️ **Don't confuse them:** this page manages the **display** of members (photos, bios). It does **not** create sign-in accounts. User accounts are managed by the general administrator.

### 9.1 The three categories (tabs)

| Tab | Use | Public display |
|---|---|---|
| **Main** | Core team. | Large centred vertical cards (photo + role + bio + links). |
| **Secondary** | Close contributors. | Compact horizontal cards (same info). |
| **Community** | Associated researchers. | Simple name + role list, no photo. |

### 9.2 Add / edit a member

Click **"Add a member"**, then fill in:
- **Name** *(required)*, **Role**, **Bio**.
- **Photo** (upload button; you can replace or remove it).
- Links: **LinkedIn**, **Website**, **Other link**.
- **English version**: *Role (EN)* and *Bio (EN)*. Two automatic-translation buttons are available: **"Auto-translate FR → EN"** (fills the English from the French) and **"Auto-translate EN → FR"** (fills the French from the English) — so you can type in whichever language you prefer, then generate the other. *(The member's name is not translated.)*

Confirm with **"Add"** (or **"Save"** when editing).

> 📸 **[Screenshot S14]** — The Team page with the three tabs and the add-member form open.

### 9.3 Reorder, move, delete

On each listed member:
- **▲ / ▼**: change the display order.
- **Category dropdown**: move the member to *Main*, *Secondary* or *Community*.
- **Pencil**: edit.
- **Trash**: delete (with confirmation).

---

## 10. Managing cartels (moderation)

Click **"Manage"** in the top bar. You land on the cartel administration screen, **locked to your dedicated site** (you only see your cartels, plus the main site's cartels for your theme in view-only mode).

> 📸 **[Screenshot S15]** — The "Manage" screen with the intro banner and the cartel list.

An **intro banner** recalls the rules: your cartels are editable; the main site's cartels for your category are read-only; your deletions only affect your dedicated site.

### 10.1 The tabs

| Tab | Content |
|---|---|
| **Published** | Cartels visible to the public. This is where you submit to the main site. |
| **Ideas & Drafts** | Cartels being written, not visible. |
| **Pending** | Proposals received from visitors, to be moderated. |
| **Archive** | Cartels removed from the public but kept (reversible). |

> 💡 The **"Submissions"** tab (the validation queue toward the main site) is reserved for the general administrator: it does not appear in your view.

### 10.2 Actions on a cartel

When you hover a row, **icon buttons** appear (a tooltip shows on hover). The available buttons depend on **where the cartel comes from**:

- **(A) Cartels from the main site (Paléo-Énergétique)** — shown here **for reference** ("Main site · view only" badge). They are **not editable**: only **Preview** and **Web preview** are offered.
- **(B) Cartels from your dedicated site** — **all** buttons are available (numbered legend below).

> 📸 **[Screenshot S16]** — Close-up on the two action rows: **(A)** a main-site cartel (only 2 buttons) and **(B)** a dedicated-site cartel (buttons 1 to 9 annotated).

**"Editing" group (view / edit the content)**

1. **Preview** — preview of the cartel in **A4 print format**, as it will be printed.
2. **Web preview** — the cartel **as visitors see it** online ("Draft" badge if not yet published).
3. **Edit** — opens the cartel **form** (title, image, description, etc.).
4. **Translate** — runs an **automatic translation**. It starts from the **language currently displayed on the site** and fills the other one: site in **French** → translates **FR → EN**; site in **English** → translates **EN → FR**. *(To translate the other way, switch the site language with the FR/EN switcher first, then run it again.)*
5. **Add a note** — **internal note** attached to the cartel, visible to administrators only — **never public** (moderation tracking).

**"Status" group (move it through its life cycle)** — the buttons shown depend on the cartel's state.

6. **Back to draft** — removes the cartel from the public (back to *Draft*). *(For a cartel still in draft or pending, a green **✓ Publish** appears here instead, to make it public.)*
7. **Archive** — **hides the cartel from the public** while keeping it (reversible). *(On an already-archived cartel, the button becomes **Unarchive**.)*
8. **Submit / withdraw from the main site** — manages display **on the main site**. The icon reflects the state: **Send** (purple = not submitted), **Clock** (pink = awaiting validation), **Globe** (green = validated, visible on the main site). Details in [chapter 11](#11-the-submit-to-the-main-site-workflow).
9. **Delete** — deletes the cartel. **Only affects your dedicated site**, never the main site.

> ⚠️ Main-site cartels (row A) cannot be edited, have their status changed, or be deleted. Every sensitive action (publish, archive, delete, submit…) asks for **confirmation**.

### 10.3 Search, filter, sort (top bar)

| Control | What it does |
|---|---|
| **Search…** (text field) | Filters the list by **title** (French and English) and by **location**. |
| **All categories** (dropdown) | Filters by one or more **categories**. An **AND / OR** switch chooses whether a cartel must belong to *all* ticked categories (AND) or *at least one* (OR). |
| **All workshops** (dropdown) | Same principle, but for **workshops**. |
| **Complex filters** (sliders icon) | Combines **several conditions** (categories / workshops) joined by AND or OR. A badge shows the number of active conditions; a banner lets you *Edit* or *Disable* them. |
| **Columns** (button) | Shows or hides the **Categories**, **Workshops**, **Location** columns (preference remembered). |
| **Year / Title / Location headers** | Click a header to **sort**; click again to reverse the order (the ↑/↓ arrow shows the direction). |

### 10.4 Bulk actions (multiple selection)

Tick the checkbox of several cartels — or **"Select all"** — to reveal an action bar:

| Action | What it does |
|---|---|
| **Select all** (header checkbox) | Selects / deselects all currently displayed cartels (per the tab and filters). |
| **Publish (N)** | Publishes, in one go, every selected cartel that isn't already published. |
| **Re-translate (N)** | Re-runs the **automatic (AI) translation** on all selected cartels. Asks for confirmation. |
| **Assign to a workshop (N)** | Attaches the selected cartels to an **existing workshop** or to a **new workshop** you name. |
| **Delete** | Deletes the selected cartels (confirmation). Only affects your dedicated site. |
| **Export** (dropdown) | Generates an export of the selected cartels — see the 4 formats below. |

**Formats offered by the "Export" menu:**

| Format | Content |
|---|---|
| **Cartels JPEG (ZIP)** | One high-resolution image per cartel, in a ZIP archive. |
| **Print PDF** | The cartels in printable A4 format (with QR code — see §10.5). |
| **Translated PDF (other language)** | A PDF of the cartels translated into the language of your choice — see [§6.6](#66-exporting-a-translated-pdf-in-any-language). |
| **Full archive (JSON + Images)** | A complete backup (data + images) that can be re-imported. |

With no selection at all, an **"Export all"** button directly offers the full archive of every cartel.

> 💡 The buttons in the bulk bar depend on context: for example **Publish (N)** does **not** appear in the *Published* tab (those cartels are already published).

> 💡 Bulk actions that **modify** (Publish, Re-translate, Assign to a workshop, Delete) **automatically skip** main-site cartels ("view only", read-only): only your own cartels are affected. **Export**, however, includes them (no risk).

> 📸 **[Screenshot S17]** — The management toolbar: at the top the **search** and the filters (*All categories*, *All workshops*, *Complex filters*); the **"N selected"** counter and the **Columns** button; the **bulk action bar** (Re-translate, Export, Assign to a workshop, Delete) with the **Export** menu open on its 4 formats; and on the left the per-row **selection checkboxes** (§10.3 and §10.4).

### 10.5 Printing and QR codes

The **Print PDF** and **JPEG** exports produce the cartels in a printable format, with a **QR code** pointing to the cartel's online record (external link if provided, otherwise the internal record). Ideal for an exhibition or physical signage.

---

## 11. The "submit to the main site" workflow

Your cartels live first on **your** dedicated site. You can propose that they **also** appear on the main site — but it is the general administrator who validates.

> ⚠️ **Important automatic behaviour:** when you **publish** a cartel of your dedicated site, it is **automatically placed in the main site's validation queue** (unless it has already been processed). So in general you have **nothing to do**: publishing is enough to propose the cartel. The "Submit" button is mainly for **re-proposing** a cartel you had withdrawn.

### 11.1 The three states (icon in the Status column)

| Icon / state | Meaning | Click = |
|---|---|---|
| **Send** (purple) | Not submitted. | Submit to the main site. |
| **Clock** (pink) | Submitted, **awaiting** validation. | Withdraw the submission. |
| **Globe** (green) | **Validated**: visible on the main site. | Withdraw from the main site. |

> 📸 **[Screenshot S18]** — The submission-state buttons on a published cartel.

### 11.2 The full flow

1. **You publish** a cartel → it automatically enters the queue (pink clock icon).
2. **The general administrator** sees the submission in their "Submissions" tab and **approves** or **rejects**.
   - *Approved* → the cartel becomes visible on the main site (green globe icon) **while remaining** on your dedicated site.
   - *Rejected* → the cartel **stays published on your dedicated site** but does not appear on the main one.
3. **At any time**, you can **withdraw** your cartel from the main site (or cancel a pending submission): it simply returns to the "published on the dedicated site only" state.

> 💡 Withdrawing a cartel from the main site **does not unpublish it** from your dedicated site: these are two separate things.

---

## 12. Step-by-step recipes

### Recipe A — Publish a new cartel
1. Sign in.
2. Click **"Submit a cartel"**.
3. Fill in at least the **Title**; ideally add an **image**, a **year**, a **location**, a **description** and **categories**.
4. Click **"Publish"**.
5. The cartel appears on the **timeline** and, automatically, in the main site's validation queue (see chapter 11).

### Recipe B — Prepare a cartel without publishing it yet
1. Same steps as recipe A, but click **"Save draft"**.
2. Find it later in **Manage → "Ideas & Drafts" tab**.
3. When it's ready: the **Publish** button.

### Recipe C — Edit the home page
1. Click **"Home page"**.
2. Adjust the **colour**, add/reorder **blocks**, select the **partners**.
3. Confirm → immediate publication.
4. Close the window and check the result on the home page.

### Recipe D — Add a member to the "About" page
1. Click **"Team"**.
2. Choose the tab (*Main*, *Secondary* or *Community*).
3. **"Add a member"** → fill in Name (+ role, bio, photo, links).
4. *(Optional)* The **Translate** button for the English version.
5. **"Add"**. Reorder with ▲ / ▼ if needed.

### Recipe E — Make a cartel appear on the main site
1. Make sure the cartel is **published** (it is then normally already submitted automatically).
2. Otherwise, in **Manage → Published**, click the cartel's **Send** icon (purple).
3. Confirm. The icon switches to the **pink clock** (pending).
4. Wait for the general administrator's validation (**green globe** icon = validated).

### Recipe F — Withdraw a cartel from the main site (without unpublishing it on yours)
1. **Manage → Published**.
2. Click the cartel's **green globe** (or **pink clock**) icon.
3. Confirm. The cartel stays visible on your dedicated site.

### Recipe G — Archive a cartel that has become obsolete
1. **Manage → Published**.
2. The **Archive** button → confirm. The cartel disappears from the public but is kept.
3. To reactivate it: **Manage → Archive → Unarchive**.

### Recipe H — Moderate a proposal received from a visitor
1. **Manage → "Pending" tab**.
2. Open **Preview** or **Edit** to check/correct.
3. **Publish** to accept, or **Delete** to reject.

### Recipe I — Print cartels for an exhibition
1. **Manage → Published**.
2. Select the cartels you want (checkboxes).
3. **Export → Print PDF** (or *Cartels JPEG (ZIP)*).
4. Print: each cartel carries a **QR code** to its online record.

### Recipe J — Export a PDF in another language (e.g. an international exhibition)
1. *(Optional)* Switch the interface to the desired **source** language (FR or EN) via the FR/EN switcher.
2. **Manage → Published**, select the cartels you want.
3. **Export → "Translated PDF (other language)"**.
4. Type the **target language** (e.g. *Spanish*) and run it. The AI translates and generates the PDF.
5. **Proofread** the PDF: the translation is not saved, it only exists in this file.

---

## 13. Things to watch out for

- **Strictly personal access.** **Never** share your credentials outside your organisation — it is **at your own risk** and **strictly forbidden** (see the legal notice).
- **Publishing = proposing to the main site.** Publishing a cartel automatically places it in the main site's validation queue. If you don't want that, keep it as a **draft**, or **withdraw** it after publishing.
- **Home page: no draft.** Any confirmed change is online immediately. Prepare your content before saving.
- **Home page is bilingual, but EN is entered by hand.** Blocks have a FR version and an EN version (*English* tab in the editor), with no automatic translation. If you leave EN empty, the English-speaking visitor sees French (see [§6.3](#63-what-gets-translated-and-what-does-not)).
- **No live preview** in the block editor: save, then check on the real page.
- **Frozen identity.** Name, slug and source type cannot be changed after creation: go through the general administrator.
- **"Workshop" source = automatic updates.** If your dedicated site is fed by a workshop, adding or removing a cartel from that workshop changes your timeline right away.
- **Main site cartels = read-only** in your view ("view only" badge).
- **Local deletion.** Deleting a cartel from your dedicated site does not affect the main site.
- **Reordering blocks and members: ▲▼ arrows only** (no drag-and-drop).
- **Visitors' contact is never public**, but valuable for getting back to them: encourage it.
- **Automatic translation**: handy, but always proofread the result (especially bios and descriptions), and remember to fill in cartels flagged **"No EN translation"**.

---

## 14. FAQ

**My published cartel doesn't appear on the main site. Is that normal?**
Yes: publishing *proposes* it (validation queue), but it needs the general administrator's **approval**. As long as the icon is a pink clock, it is pending.

**Can I change my dedicated site's colour?**
Yes, via **"Home page" → Colour**. It applies everywhere.

**Can I change my dedicated site's name or address (slug)?**
Not yourself: ask the general administrator.

**Why does my home page stay in French for an English-speaking visitor?**
Because you haven't (yet) entered an **English version of the blocks**. Open "Home page", switch to the **English** tab and compose the EN version (see [§6.3](#63-what-gets-translated-and-what-does-not) and [§8.2](#82-the-content-the-block-editor)). As long as it's empty, the French version is shown.

**How do I offer my cartels in Spanish/German/… for an exhibition?**
Use the **"Translated PDF (other language)"** export (see [§6.6](#66-exporting-a-translated-pdf-in-any-language) and recipe J). It is a one-off PDF, not saved.

**What's the difference between "Team" and account management?**
"Team" manages the **display** of people on the "About" page. **Sign-in accounts** are managed by the general administrator.

**I deleted a cartel by mistake.**
Deletion is permanent on the dedicated site side. Before deleting, prefer **Archive** (reversible). If in doubt, contact the general administrator (an archive/export may exist).

**How do I temporarily hide a cartel without losing it?**
Use **Archive**: it is removed from the public but kept, and **Unarchive** republishes it.

**Are my images compressed automatically?**
Yes, on upload, to optimise loading, with no action on your part.

---

## Glossary

- **Cartel** — the record of an object/invention shown on the timeline.
- **Dedicated site** — a standalone thematic mini-site attached to the Paléo ecosystem.
- **Slug** — the "address" part of a dedicated site in the URL.
- **Owner** — the administrator of a given dedicated site.
- **Superadmin / General administrator** — the administrator of the whole platform.
- **Source (category / workshop)** — how the dedicated site's timeline is fed.
- **Status** — a cartel's state: Draft, Pending, Published, Archived.
- **Submit to the main site** — propose that a published cartel also appears on the main site (subject to validation).
- **Block** — a content element of the home page (title, text, image, etc.).
- **Fallback** — showing the French text when the English version of a field is empty.
- **QR code** — a 2D barcode printed on a cartel, pointing to its online record.

---

*End of guide. For anything affecting a dedicated site's identity (name, address, source) or account creation, contact the platform's general administrator.*
