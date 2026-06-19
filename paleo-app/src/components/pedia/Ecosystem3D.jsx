/**
 * Ecosystem3D.jsx — scène WebGL de l'écosystème Paléo (vitrine /pedia).
 *
 * Métaphore « système solaire » : un cœur central (le programme principal)
 * autour duquel gravitent les sous-sites, chacun coloré par sa primary_color.
 *
 * ⚠️ Ce module est volontairement chargé en LAZY (React.lazy) : il embarque
 * three.js (~lourd) et ne doit être téléchargé que lorsqu'on affiche réellement
 * la 3D sur /pedia — jamais dans le bundle principal de l'app.
 *
 * Accessibilité : les labels sont de vrais liens <a> (focusables). Le wrapper
 * (EcosystemShowcase) fournit en plus une liste de liens masquée visuellement,
 * et bascule sur le diagramme 2D si WebGL est absent ou si l'utilisateur
 * préfère réduire les animations.
 */
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// Ouvre la cible d'un nœud : interne → navigation SPA, externe → nouvel onglet.
const useNodeNavigate = () => {
    const navigate = useNavigate();
    return (href, external) => {
        if (external) window.open(href, '_blank', 'noopener,noreferrer');
        else navigate(href);
    };
};

const setCursor = (v) => { document.body.style.cursor = v; };

// ── Cœur central (le hub) ─────────────────────────────────────
const Core = ({ hub, onActivate }) => {
    // Titre estompé par défaut, plein au survol du cœur OU du titre.
    const [meshHover, setMeshHover] = useState(false);
    const [labelHover, setLabelHover] = useState(false);
    const hovered = meshHover || labelHover;

    return (
        <group>
            {/* lumière émise par le cœur, qui éclaire les planètes */}
            <pointLight position={[0, 0, 0]} intensity={1.4} distance={40} decay={0} color="#fff5e6" />

            {/* sphère sombre lumineuse */}
            <mesh
                onClick={(e) => { e.stopPropagation(); onActivate(hub.href, hub.external); }}
                onPointerOver={(e) => { e.stopPropagation(); setCursor('pointer'); setMeshHover(true); }}
                onPointerOut={() => { setCursor('auto'); setMeshHover(false); }}
            >
                <sphereGeometry args={[1.3, 48, 48]} />
                {/* Cœur jaune : la couleur signature Paléo-Énergétique (--color-accent #FFE700). */}
                <meshStandardMaterial color="#FFE700" emissive="#FFE700" emissiveIntensity={0.38} roughness={0.5} metalness={0.1} />
            </mesh>

            {/* halo lumineux (sphère additive transparente) */}
            <mesh scale={1.35}>
                <sphereGeometry args={[1.3, 32, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.05} depthWrite={false} />
            </mesh>

            <Html center distanceFactor={10} position={[0, 0, 0]} zIndexRange={[10, 0]}>
                <a
                    href={hub.href}
                    {...(hub.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setLabelHover(true)}
                    onMouseLeave={() => setLabelHover(false)}
                    style={{ ...LABEL_STYLE_CORE, opacity: hovered ? 1 : 0.4, transition: 'opacity 0.2s' }}
                >
                    {hub.host}
                </a>
            </Html>
        </group>
    );
};

// ── Reliefs & décor des planètes ──────────────────────────────
const PLANET_RADIUS = 0.62;
const UP = new THREE.Vector3(0, 1, 0);

// Hash déterministe slug → graine flottante (~0..10) : relief stable & distinct.
const hashSeed = (str = '') => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return (h % 1000) / 100;
};
// Hash entier (FNV-1a) → choix d'un type de planète / graine de PRNG.
const hashInt = (str = '') => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
};
// PRNG déterministe (mulberry32) : aléa stable, seedé par planète → pas de
// scintillement au re-render, mais disposition non régulière.
const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Géométrie low-poly facettée : icosaèdre + déformation radiale douce. Le bruit
// ne dépend que de la position du sommet → sommets coïncidents déplacés à
// l'identique (pas de fissure). `relief` règle l'amplitude selon le type.
const usePlanetGeometry = (radius, seed, relief) => useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(radius, 2);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const noise =
            Math.sin((v.x + seed) * 3.1) *
            Math.cos((v.y - seed) * 2.7) *
            Math.sin((v.z + seed) * 2.3);
        v.multiplyScalar(1 + noise * relief);
        pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
}, [radius, seed, relief]);

// Disposition ALÉATOIRE sur toute la sphère, avec distance angulaire minimale
// (rejection sampling) → pas de collision entre décors. Renvoie pour chaque
// item sa direction + quelques aléas (taille/rotation). `rng` seedé → stable
// par planète mais sans motif régulier.
const scatterItems = (count, rng, minAngle = 0.4) => {
    const items = [];
    let attempts = 0;
    while (items.length < count && attempts < count * 60) {
        attempts++;
        // point uniforme sur la sphère
        const z = 2 * rng() - 1;
        const theta = 2 * Math.PI * rng();
        const r = Math.sqrt(Math.max(0, 1 - z * z));
        const dir = new THREE.Vector3(r * Math.cos(theta), z, r * Math.sin(theta));
        if (items.every(it => it.dir.angleTo(dir) >= minAngle)) {
            items.push({ dir, a: rng(), b: rng(), c: rng() });
        }
    }
    return items;
};

// Pose un objet sur la surface, debout (son +Y suit la normale de surface).
const Planted = ({ dir, children }) => {
    const quaternion = useMemo(() => {
        const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
        return [q.x, q.y, q.z, q.w];
    }, [dir]);
    const position = useMemo(() => [dir.x, dir.y, dir.z].map(c => c * (PLANET_RADIUS - 0.02)), [dir]);
    return <group position={position} quaternion={quaternion}>{children}</group>;
};

// ── Décors posables (assis sur le sol local, +Y vers le ciel) ──
// Éolienne : mât + nacelle + rotor 3 pales qui tourne lentement.
const Turbine = ({ reducedMotion }) => {
    const rotor = useRef();
    useFrame((_, delta) => {
        if (reducedMotion || !rotor.current) return;
        rotor.current.rotation.z += Math.min(delta, 0.05) * 0.9;
    });
    return (
        <group scale={0.32}>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.025, 0.04, 1, 6]} />
                <meshStandardMaterial color="#e8e8ec" roughness={0.5} metalness={0.1} />
            </mesh>
            <group position={[0, 1, 0]}>
                <mesh>
                    <boxGeometry args={[0.14, 0.12, 0.22]} />
                    <meshStandardMaterial color="#cfcfd6" roughness={0.5} />
                </mesh>
                <group ref={rotor} position={[0, 0, 0.14]}>
                    {[0, 1, 2].map(i => (
                        <group key={i} rotation={[0, 0, i * (Math.PI * 2 / 3)]}>
                            <mesh position={[0, 0.28, 0]}>
                                <boxGeometry args={[0.05, 0.52, 0.014]} />
                                <meshStandardMaterial color="#f5f5f7" roughness={0.4} />
                            </mesh>
                        </group>
                    ))}
                </group>
            </group>
        </group>
    );
};

// Arbre : tronc + houppier conique facetté.
const Tree = () => (
    <group scale={0.34}>
        <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.03, 0.045, 0.24, 5]} />
            <meshStandardMaterial color="#6b4a2b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
            <coneGeometry args={[0.22, 0.6, 7]} />
            <meshStandardMaterial color="#3f7d44" roughness={0.85} flatShading />
        </mesh>
    </group>
);

// Panneau solaire : poteau + dalle bleu nuit inclinée vers le ciel.
const SolarPanel = () => (
    <group scale={0.34}>
        <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.22, 5]} />
            <meshStandardMaterial color="#8a8a90" roughness={0.6} metalness={0.2} />
        </mesh>
        <group position={[0, 0.26, 0]} rotation={[-0.6, 0, 0]}>
            <mesh>
                <boxGeometry args={[0.42, 0.012, 0.3]} />
                <meshStandardMaterial color="#1b2a52" roughness={0.3} metalness={0.5} emissive="#1a3a86" emissiveIntensity={0.25} />
            </mesh>
        </group>
    </group>
);

// Rocher : petit icosaèdre minéral, légèrement enfoncé dans le sol (sa base est
// ensevelie sous la surface → plus réaliste qu'un caillou posé en lévitation).
// Surface locale ≈ y = 0.02 (cf. Planted) ; on place le centre juste au-dessus.
const Rock = ({ rnd }) => {
    const r = 0.06 + (rnd?.a ?? 0.5) * 0.07;           // rayon monde 0.06..0.13
    return (
        <mesh
            position={[0, 0.02 + r * 0.3, 0]}          // ~1/3 du rocher enseveli
            rotation={[(rnd?.a ?? 0) * 6.28, (rnd?.b ?? 0) * 6.28, (rnd?.c ?? 0) * 6.28]}
        >
            <icosahedronGeometry args={[r, 0]} />
            <meshStandardMaterial color="#9a9aa0" roughness={0.95} metalness={0.1} flatShading />
        </mesh>
    );
};

// Anneau (type « glacé »), incliné autour de la planète.
const PlanetRing = ({ color }) => (
    <mesh rotation={[-Math.PI / 2 + 0.42, 0, 0.18]}>
        <ringGeometry args={[PLANET_RADIUS * 1.45, PLANET_RADIUS * 2.15, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
);

// Oriente chaque décor d'un lacet aléatoire (autour de la normale) pour casser
// l'uniformité, puis rend le bon objet selon le type.
const Decoration = ({ kind, index, rnd, reducedMotion }) => {
    let el = null;
    if (kind === 'turbine')      el = <Turbine reducedMotion={reducedMotion} />;
    else if (kind === 'tree')    el = <Tree />;
    else if (kind === 'solar')   el = <SolarPanel />;
    else if (kind === 'rock')    el = <Rock rnd={rnd} />;
    else if (kind === 'mixed')   el = (index % 2 === 0) ? <Tree /> : <Turbine reducedMotion={reducedMotion} />;
    if (!el) return null;
    return <group rotation={[0, (rnd?.b ?? 0) * Math.PI * 2, 0]}>{el}</group>;
};

// ── Types de planètes (matériau + relief + décor), attribués par sous-site ──
const PLANET_TYPES = [
    { key: 'wind',   roughness: 0.70, metalness: 0.05, emissive: 0.16, relief: 0.07, kind: 'turbine', count: 5 },
    { key: 'forest', roughness: 0.82, metalness: 0.03, emissive: 0.14, relief: 0.06, kind: 'tree',    count: 9 },
    { key: 'solar',  roughness: 0.55, metalness: 0.12, emissive: 0.16, relief: 0.04, kind: 'solar',   count: 6 },
    { key: 'rocky',  roughness: 0.90, metalness: 0.18, emissive: 0.10, relief: 0.13, kind: 'rock',    count: 8 },
    { key: 'icy',    roughness: 0.25, metalness: 0.45, emissive: 0.20, relief: 0.03, kind: 'none',    count: 0, ring: true },
    { key: 'lush',   roughness: 0.75, metalness: 0.05, emissive: 0.15, relief: 0.07, kind: 'mixed',   count: 8 },
];

// ── Une planète (un sous-site) en orbite ──────────────────────
const Planet = ({ node, typeIndex, radius, tilt, phase0, speed, reducedMotion, onActivate }) => {
    const color = node.color || '#9aa0a6';
    const seed = hashSeed(node.slug);
    // Type imposé par la Scene (ordre mélangé par position) → variété garantie.
    const type = PLANET_TYPES[typeIndex];
    const geom = usePlanetGeometry(PLANET_RADIUS, seed, type.relief);

    // Décor : disposition aléatoire seedée, anti-collision.
    const items = useMemo(
        () => scatterItems(type.count, mulberry32(hashInt((node.slug || '') + ':scatter'))),
        [type, node.slug]
    );
    // Rotation propre : axe ET sens aléatoires, très lente (stable par planète).
    const spin = useMemo(() => {
        const rng = mulberry32(hashInt((node.slug || '') + ':spin'));
        const axis = new THREE.Vector3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();
        const rate = (0.015 + rng() * 0.05) * (rng() < 0.5 ? -1 : 1);
        return { axis, rate };
    }, [node.slug]);

    // Titre estompé par défaut, plein au survol de la planète OU du titre.
    const [meshHover, setMeshHover] = useState(false);
    const [labelHover, setLabelHover] = useState(false);
    const hovered = meshHover || labelHover;

    const arm = useRef();
    const body = useRef();
    useFrame((_, delta) => {
        if (reducedMotion) return;
        const d = Math.min(delta, 0.05); // borné : pas de saut après un onglet en fond
        if (arm.current) arm.current.rotation.y += d * speed;                  // révolution (sens ± via speed)
        if (body.current) body.current.rotateOnAxis(spin.axis, d * spin.rate); // rotation propre
    });

    return (
        <group rotation={[tilt, 0, tilt * 0.4]}>
            <group ref={arm} rotation={[0, phase0, 0]}>
                <group position={[radius, 0, 0]}>
                    {/* Planète + décor : tourne sur elle-même ET cliquable */}
                    <group
                        ref={body}
                        onClick={(e) => { e.stopPropagation(); onActivate(node.href, node.external); }}
                        onPointerOver={(e) => { e.stopPropagation(); setCursor('pointer'); setMeshHover(true); }}
                        onPointerOut={() => { setCursor('auto'); setMeshHover(false); }}
                    >
                        <mesh geometry={geom}>
                            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={type.emissive} roughness={type.roughness} metalness={type.metalness} flatShading />
                        </mesh>
                        {type.ring && <PlanetRing color={color} />}
                        {items.map((it, i) => (
                            <Planted key={i} dir={it.dir}>
                                <Decoration kind={type.kind} index={i} rnd={it} reducedMotion={reducedMotion} />
                            </Planted>
                        ))}
                    </group>
                    <Html center distanceFactor={12} position={[0, 1.05, 0]} zIndexRange={[9, 0]}>
                        <a
                            href={node.href}
                            {...(node.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={() => setLabelHover(true)}
                            onMouseLeave={() => setLabelHover(false)}
                            style={{ ...labelStyle(color), opacity: hovered ? 1 : 0.4, transition: 'opacity 0.2s' }}
                        >
                            {node.name}
                        </a>
                    </Html>
                </group>
            </group>
        </group>
    );
};

// ── Ceinture d'astéroïdes décorative (au-delà des orbites) ────
const ASTEROID_GEO = new THREE.IcosahedronGeometry(1, 0);
const ASTEROID_MAT = new THREE.MeshStandardMaterial({ color: '#8a8a90', roughness: 1, metalness: 0.05, flatShading: true });

const AsteroidBelt = ({ radius, count = 80, reducedMotion }) => {
    const ref = useRef();
    const rocks = useMemo(() => {
        const rng = mulberry32((0x9e3779b9 ^ Math.round(radius * 1000)) >>> 0);
        return Array.from({ length: count }, () => {
            const a = rng() * Math.PI * 2;
            const rr = radius + (rng() - 0.5) * 1.4;     // largeur de la ceinture
            const y = (rng() - 0.5) * 0.5;               // épaisseur verticale
            return {
                position: [Math.cos(a) * rr, y, Math.sin(a) * rr],
                scale: 0.03 + rng() * 0.06,
                rotation: [rng() * 6.28, rng() * 6.28, rng() * 6.28],
            };
        });
    }, [radius, count]);
    useFrame((_, delta) => {
        if (reducedMotion || !ref.current) return;
        ref.current.rotation.y += Math.min(delta, 0.05) * 0.02;
    });
    return (
        <group ref={ref} rotation={[0.16, 0, 0.05]}>
            {rocks.map((r, i) => (
                <mesh key={i} geometry={ASTEROID_GEO} material={ASTEROID_MAT}
                    position={r.position} scale={r.scale} rotation={r.rotation} />
            ))}
        </group>
    );
};

const Scene = ({ hub, orbits, reducedMotion }) => {
    const activate = useNodeNavigate();
    // Ordre des types mélangé (seedé sur l'ensemble des slugs) : les premières
    // planètes reçoivent des types DISTINCTS → toutes les variétés (dont la
    // forêt) apparaissent s'il y a assez de planètes, au lieu d'un tirage par
    // slug qui peut « rater » un type.
    const typeOrder = useMemo(() => {
        const order = PLANET_TYPES.map((_, idx) => idx);
        const rng = mulberry32(hashInt(orbits.map(o => o.slug).join('|')));
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        return order;
    }, [orbits]);
    return (
        <>
            <color attach="background" args={['#0e0e12']} />
            <ambientLight intensity={0.85} />
            <directionalLight position={[6, 5, 4]} intensity={1.45} />

            <Stars radius={60} depth={25} count={1200} factor={3} saturation={0} fade speed={reducedMotion ? 0 : 0.12} />

            <Core hub={hub} onActivate={activate} />

            <AsteroidBelt radius={3.1 + orbits.length * 1.2 + 0.8} reducedMotion={reducedMotion} />

            {orbits.map((node, i) => {
                // Vitesse orbitale : forte variance + minimum bas + SENS aléatoire.
                const rng = mulberry32(hashInt((node.slug || '') + ':orbit'));
                const magnitude = (0.01 + rng() * 0.055) / (1 + i * 0.15);
                const speed = magnitude * (rng() < 0.5 ? -1 : 1);
                // Type choisi par le sous-site (prioritaire), sinon auto (ordre mélangé).
                const explicit = PLANET_TYPES.findIndex(t => t.key === node.planetType);
                const typeIndex = explicit >= 0 ? explicit : typeOrder[i % typeOrder.length];
                return (
                    <Planet
                        key={node.slug || node.host}
                        node={node}
                        typeIndex={typeIndex}
                        radius={3.1 + i * 1.2}
                        tilt={((i % 2 === 0) ? 1 : -1) * (0.14 + i * 0.05)}
                        phase0={(i / Math.max(orbits.length, 1)) * Math.PI * 2}
                        speed={speed}
                        reducedMotion={reducedMotion}
                        onActivate={activate}
                    />
                );
            })}

            <OrbitControls
                enablePan={false}
                enableZoom
                minDistance={6}
                maxDistance={22}
                minPolarAngle={Math.PI * 0.18}
                maxPolarAngle={Math.PI * 0.82}
                autoRotate={!reducedMotion}
                autoRotateSpeed={0.12}
                enableDamping
                dampingFactor={0.08}
            />
        </>
    );
};

const Ecosystem3D = ({ hub, orbits, reducedMotion = false }) => (
    <Canvas
        // Vue initiale plus dézoomée et légèrement surélevée : tout le système
        // (planètes + ceinture) tient dans le cadre avec de la marge.
        camera={{ position: [0, 5, 15], fov: 50 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true }}
        style={{ width: '100%', height: '100%', display: 'block', borderRadius: 'inherit' }}
    >
        <Scene hub={hub} orbits={orbits} reducedMotion={reducedMotion} />
    </Canvas>
);

// ── Styles des labels (pilules, cohérentes avec le diagramme 2D) ──
const LABEL_BASE = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 13px',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: '0.82rem',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(2px)',
    userSelect: 'none',
};

const LABEL_STYLE_CORE = {
    ...LABEL_BASE,
    background: 'rgba(255,255,255,0.95)',
    color: '#1a1a1a',
    fontWeight: 700,
};

const labelStyle = (color) => ({
    ...LABEL_BASE,
    background: 'rgba(20,20,24,0.78)',
    color: '#fff',
    border: `1.5px solid ${color}`,
});

export default Ecosystem3D;
