import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, Trash } from 'lucide-react';

const DataManager = () => {
    const { isLocalMode, fetchData } = useApp();
    const fileInputRef = useRef(null);

    // Only show in Local Mode for now (or strictly for debug)
    if (!isLocalMode) return null;

    const handleExport = () => {
        const data = {
            cartels: JSON.parse(localStorage.getItem('paleo_local_db_cartels.json') || '[]'),
            drafts: JSON.parse(localStorage.getItem('paleo_local_db_drafts.json') || '[]'),
            config: JSON.parse(localStorage.getItem('paleo_config') || '{}')
        };
        // Also images? Exporting all localStorage keys starting with paleo_local_images/ ?
        // That might be huge. Let's just export the JSONs for now.
        // User asked for "full program run local", usually means persistence.

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paleo_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.cartels) localStorage.setItem('paleo_local_db_cartels.json', JSON.stringify(data.cartels));
                if (data.drafts) localStorage.setItem('paleo_local_db_drafts.json', JSON.stringify(data.drafts));
                // Reload
                alert("Import réussi !");
                fetchData();
            } catch (err) {
                alert("Erreur import JSON invalide");
            }
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm("ATTENTION: Cela va effacer toutes les données locales. Êtes-vous sûr ?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="card" style={{ marginTop: '20px', border: '1px dashed orange' }}>
            <h4> gestion des données locales </h4>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px' }}>
                    <Download size={16} /> Exporter JSON
                </button>
                <div style={{ position: 'relative' }}>
                    <button onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px' }}>
                        <Upload size={16} /> Importer JSON
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleImport}
                    />
                </div>
                <button onClick={handleReset} style={{ color: 'red', borderColor: 'red', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
                    <Trash size={16} /> Reset
                </button>
            </div>
            <small style={{ color: 'gray', display: 'block', marginTop: '5px' }}>
                Vos données sont enregistrées dans ce navigateur. Exportez-les régulièrement.
                (Les images ne sont pas exportées dans ce fichier JSON simple).
            </small>
        </div>
    );
};

export default DataManager;
