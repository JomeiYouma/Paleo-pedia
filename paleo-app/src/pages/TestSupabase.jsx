import React, { useState, useEffect } from 'react';
import supabaseService from '../services/supabaseService';
import './TestSupabase.css';

const TestSupabase = () => {
  const [status, setStatus] = useState('🔄 Loading...');
  const [cartels, setCartels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    const test = async () => {
      try {
        addLog('📡 Démarrage du test Supabase...', 'info');

        // 1. Health check
        addLog('1️⃣  Health Check...', 'info');
        const healthy = await supabaseService.checkHealth();
        if (!healthy) throw new Error('❌ Health check failed');
        addLog('✅ Health OK', 'success');

        // 2. Current user
        addLog('2️⃣  Récupération utilisateur...', 'info');
        const currentUser = await supabaseService.getCurrentUser();
        if (currentUser?.user) {
          setUser(currentUser.user);
          addLog(`✅ User: ${currentUser.user.email}`, 'success');
          addLog(`   Role: ${currentUser.metadata?.role || 'N/A'}`, 'info');
        } else {
          addLog('⚠️  Utilisateur non authentifié (ok pour public)', 'warning');
        }

        // 3. Get categories
        addLog('3️⃣  Chargement catégories...', 'info');
        const cats = await supabaseService.getCategories();
        setCategories(cats);
        addLog(`✅ ${cats.length} catégories chargées`, 'success');

        // 4. Get published cartels
        addLog('4️⃣  Chargement cartels publiés...', 'info');
        const publishedCartels = await supabaseService.getPublishedCartels();
        setCartels(publishedCartels);
        addLog(`✅ ${publishedCartels.length} cartels publiés chargés`, 'success');

        setStatus('✅ Tous les tests réussis !');
      } catch (err) {
        const msg = err.message || String(err);
        addLog(`❌ Erreur: ${msg}`, 'error');
        setError(msg);
        setStatus('❌ Erreur lors du test');
      }
    };

    test();
  }, []);

  return (
    <div className="test-supabase">
      <div className="test-header">
        <h1>🧪 Test Supabase Service</h1>
        <div className={`status ${status.includes('✅') ? 'success' : error ? 'error' : 'loading'}`}>
          {status}
        </div>
      </div>

      {user && (
        <div className="user-info">
          <strong>👤 Utilisateur:</strong> {user.email}
        </div>
      )}

      <div className="test-logs">
        <h2>📋 Logs:</h2>
        <div className="logs-container">
          {logs.map((log, i) => (
            <div key={i} className={`log-entry log-${log.type}`}>
              <span className="time">{log.time}</span>
              <span className="message">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="test-results">
        <div className="result-section">
          <h2>📚 Catégories ({categories.length})</h2>
          <div className="items-list">
            {categories.length === 0 ? (
              <p>Aucune catégorie (ok si BD vide)</p>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="item">
                  <strong>{cat.name}</strong>
                  <small>{cat.description}</small>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="result-section">
          <h2>🗂️ Cartels Publiés ({cartels.length})</h2>
          <div className="items-list">
            {cartels.length === 0 ? (
              <p>Aucun cartel publié (créez-en un en tanto que admin)</p>
            ) : (
              cartels.slice(0, 5).map(cartel => (
                <div key={cartel.id} className="item">
                  <strong>{cartel.titre}</strong>
                  <small>Status: {cartel.status} | Visible: {cartel.visible ? 'Oui' : 'Non'}</small>
                  <small>Créé par: {cartel.created_by}</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-box">
          <strong>Erreur rencontrée:</strong>
          <pre>{error}</pre>
          <p>
            <strong>À vérifier:</strong>
            <ul>
              <li>✅ .env.local contient VITE_SUPABASE_URL et VITE_SUPABASE_KEY</li>
              <li>✅ schema.sql a été exécuté en Supabase</li>
              <li>✅ FIX_JWT_ROLE.sql a été exécuté</li>
              <li>✅ RLS policies sont activées</li>
            </ul>
          </p>
        </div>
      )}
    </div>
  );
};

export default TestSupabase;
