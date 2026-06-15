import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { usePageMeta } from '../hooks/usePageMeta';

// Page « Méthodologie » de la vitrine Paléo-Pédia (/pedia/methodologie).
// Détaille la démarche du projet — volontairement SANS équipe ni partenaires
// (ces aspects vivent sur /presentation). Palette neutre, cohérente avec
// PaleoPedia. Le texte est un premier jet, à affiner avec le contenu réel.

const STEPS = [
    {
        n: '01',
        title: 'Repérer les techniques oubliées',
        body: "Nous identifions des techniques énergétiques anciennes, marginales ou disparues à partir d'archives, d'ouvrages, de brevets anciens, de témoignages et d'observations de terrain.",
    },
    {
        n: '02',
        title: 'Documenter en cartels',
        body: "Chaque technique devient un cartel : description, datation, lieu, source et image. Les cartels alimentent une frise chronologique interactive, une carte et une arborescence.",
    },
    {
        n: '03',
        title: 'Catégoriser',
        body: "Les cartels sont rattachés à des catégories thématiques (solaire, hydraulique, éolien…) qui structurent l'exploration et donnent naissance à des sous-sites dédiés.",
    },
    {
        n: '04',
        title: 'Vérifier',
        body: "Chaque contribution passe par une étape de validation : exactitude des sources, qualité des images, cohérence avec le corpus existant.",
    },
    {
        n: '05',
        title: 'Diffuser',
        body: "Le corpus s'explore librement via la frise, la carte et l'arborescence, et se décline en sous-sites thématiques ouverts à toutes et tous.",
    },
];

const PRINCIPLES = [
    ['Sources vérifiables', "Chaque cartel cite son origine ; le doute est signalé plutôt que masqué."],
    ['Ouvert à la contribution', "Le public peut proposer des cartels, soumis ensuite à validation."],
    ['Accessible', "Navigation au clavier, contrastes soignés et pages conformes aux bonnes pratiques (Opquast)."],
    ['Low-tech & décentralisé', "On valorise l'innovation vernaculaire, sobre et reproductible, plutôt que la prouesse isolée."],
];

const PaleoPediaMethodo = () => {
    usePageMeta({
        title: 'Méthodologie — Paléo-Pédia',
        description: "La démarche du projet Paléo-Énergétique : repérer, documenter, catégoriser, vérifier et diffuser les techniques énergétiques oubliées.",
        path: '/pedia/methodologie',
    });

    return (
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 72px' }}>
            <Breadcrumb crumbs={[{ label: 'Paléo-Pédia', href: '/pedia' }]} current="Méthodologie" />

            <header style={{ marginBottom: 40 }}>
                <h1 style={{
                    margin: '0 0 14px',
                    fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
                    color: 'var(--color-text)',
                    lineHeight: 1.15,
                }}>
                    La méthodologie du projet
                </h1>
                <p style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    lineHeight: 1.65,
                    color: 'var(--color-text-muted)',
                }}>
                    Paléo-Énergétique recense, documente et remet en lumière des techniques
                    énergétiques anciennes ou méconnues — pour montrer que l'innovation sobre,
                    vernaculaire et décentralisée a une longue histoire dont nous pouvons
                    réapprendre. Voici comment nous travaillons.
                </p>
            </header>

            {/* Étapes de la démarche */}
            <section aria-label="Étapes de la démarche" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
                {STEPS.map(step => (
                    <article key={step.n} style={{
                        display: 'flex',
                        gap: 18,
                        alignItems: 'flex-start',
                        padding: '20px 22px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 14,
                    }}>
                        <div aria-hidden="true" style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.6rem',
                            fontWeight: 400,
                            color: 'var(--color-primary)',
                            lineHeight: 1,
                            flexShrink: 0,
                            minWidth: 44,
                        }}>
                            {step.n}
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--color-text)' }}>{step.title}</h2>
                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>{step.body}</p>
                        </div>
                    </article>
                ))}
            </section>

            {/* Principes */}
            <section aria-labelledby="principles-heading" style={{ marginBottom: 48 }}>
                <h2 id="principles-heading" style={{ margin: '0 0 18px', fontSize: '1.4rem', color: 'var(--color-text)' }}>
                    Nos principes
                </h2>
                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                    {PRINCIPLES.map(([title, body]) => (
                        <div key={title} style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: 14 }}>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--color-text)' }}>{title}</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--color-text-muted)' }}>{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Renvoi vers l'écosystème */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 28, textAlign: 'center' }}>
                <Link to="/pedia" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600,
                }}>
                    Explorer l'écosystème Paléo <ArrowRight size={18} aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
};

export default PaleoPediaMethodo;
