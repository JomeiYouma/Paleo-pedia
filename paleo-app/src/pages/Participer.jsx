import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Send, Search, FileText } from 'lucide-react';

// Page "Appel à participation" — contenu repris de
// https://paleo-energetique.org/participer/kit-affiche/
// Les emplacements [À REMPLACER] doivent être complétés (PDF du kit,
// affiche haute définition, exemples concrets d'inventions).
const Participer = () => {
    return (
        <div style={{ maxWidth: '900px', margin: '60px auto', padding: '0 20px', lineHeight: '1.7', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-pink-darker, #C2185B)' }}>
                Appel à participation
            </h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                Dans le cadre de notre projet de recherche participatif et citoyen dans le domaine de l'énergie,
                vous pouvez télécharger notre kit « appel à participation » pour nous aider à trouver d'anciennes
                inventions, d'anciennes innovations sociales et des imaginaires collectifs.
            </p>

            {/* ── Affiche + bouton de téléchargement ───────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '40px',
                alignItems: 'center',
                background: '#fafafa',
                padding: '30px',
                borderRadius: '12px',
                marginBottom: '50px',
            }}>
                <div style={{
                    background: '#eee',
                    aspectRatio: '700 / 989',
                    borderRadius: '8px',
                    border: '2px dashed #bbb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888',
                    textAlign: 'center',
                    padding: '20px',
                    fontSize: '0.9rem',
                }}>
                    {/* [À REMPLACER : affiche du kit appel à participation
                        — équivalent de https://paleo-energetique.org/wp-content/uploads/.../kif-affiche.jpg ] */}
                    Affiche « Appel à participation »<br/>
                    <span style={{ fontSize: '0.8rem' }}>(à remplacer par le visuel du kit)</span>
                </div>

                <div>
                    <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Téléchargez le kit</h2>
                    <p>
                        Affichez-le, partagez-le, faites circuler l'information autour de vous : chaque innovation
                        oubliée retrouvée enrichit la frise chronologique du projet.
                    </p>
                    <a
                        href="#"
                        /* [À REMPLACER : href vers le PDF du kit affiche, ex: /downloads/kit-appel-participation.pdf ] */
                        className="paleo-btn"
                    >
                        <Download size={18} /> Télécharger le kit (PDF)
                    </a>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '14px' }}>
                        Une version image (JPG) est aussi disponible{' '}
                        <a
                            href="#"
                            /* [À REMPLACER : href vers l'image JPG du kit, ex: /downloads/kit-appel-participation.jpg ] */
                            style={{ color: '#666' }}
                        >
                            ici
                        </a>.
                    </p>
                </div>
            </div>

            {/* ── Proposer une invention directement ───────────────────── */}
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
                marginBottom: '50px',
                textAlign: 'center',
            }}>
                <h2 style={{ marginTop: 0 }}>Vous avez déjà une invention en tête ?</h2>
                <p style={{ marginBottom: '24px' }}>
                    Proposez-la directement en ligne. Notre équipe la relira avant intégration à la frise
                    chronologique.
                </p>
                <Link to="/app/create" className="paleo-btn">
                    <Send size={18} /> Proposer une invention
                </Link>
            </div>

            {/* ── Que recherche-t-on ? ─────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px' }}>Que recherchons-nous ?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
                {[
                    { title: 'Inventions techniques oubliées', desc: "Machines, prototypes, brevets, dispositifs liés à l'énergie qui n'ont pas été généralisés." },
                    { title: 'Innovations sociales',           desc: "Pratiques collectives, coopératives, autopartage, mutualisation… avant l'heure." },
                    { title: 'Imaginaires collectifs',         desc: "Récits, fictions, projections d'époque qui anticipaient des transitions énergétiques." },
                ].map((card, i) => (
                    <div
                        key={i}
                        style={{
                            background: 'var(--color-surface)',
                            padding: '20px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            borderTop: '3px solid var(--color-accent)',
                        }}
                    >
                        <Search size={22} color="var(--color-primary)" />
                        <h3 style={{ marginTop: '10px', fontSize: '1.05rem' }}>{card.title}</h3>
                        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', margin: 0 }}>
                            {card.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Comment ça marche ────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px' }}>Comment ça marche ?</h2>
            <ol style={{ paddingLeft: '20px', marginTop: '20px', fontSize: '1.05rem' }}>
                <li style={{ marginBottom: '12px' }}>
                    <strong>Vous nous signalez</strong> une invention via le formulaire ou par email.
                </li>
                <li style={{ marginBottom: '12px' }}>
                    <strong>Notre équipe vérifie</strong> les sources et complète si besoin (date, lieu, brevet, archives).
                </li>
                <li style={{ marginBottom: '12px' }}>
                    <strong>L'invention rejoint la frise</strong> chronologique avec mention de la personne qui l'a exhumée.
                </li>
                <li>
                    <strong>Vous êtes crédité·e</strong> comme paléo-héro·ïne du projet.
                </li>
            </ol>

            {/* ── Pour aller plus loin ─────────────────────────────────── */}
            <div style={{
                background: '#f8f9fa',
                padding: '24px',
                borderRadius: '8px',
                borderLeft: '4px solid var(--color-pink-darker, #C2185B)',
                marginTop: '40px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
            }}>
                <FileText size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <strong>Une question, un doute ?</strong><br />
                    <span style={{ fontSize: '0.95rem' }}>
                        Écrivez-nous à{' '}
                        <a href="mailto:hello@paleo-energetique.org">hello@paleo-energetique.org</a>{' '}
                        ou via la <Link to="/contact">page contact</Link>.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Participer;
