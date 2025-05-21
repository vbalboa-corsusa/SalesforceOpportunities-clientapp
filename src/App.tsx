import React, { useState, useEffect } from 'react';
import { Opportunity } from './types/Opportunity';
import './App.css';

// Configuración de la API
const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewOnly, setShowNewOnly] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, [showNewOnly]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/opportunities${showNewOnly ? '/new' : ''}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(errorData || 'Error al obtener las oportunidades');
      }

      const data = await response.json();
      console.log('Received data:', data);
      setOpportunities(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('No se pudo conectar con el servidor. Por favor, asegúrese de que la API esté corriendo en http://localhost:5000');
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Oportunidades de Salesforce</h1>
        <div className="controls">
          <button 
            onClick={() => setShowNewOnly(true)}
            className="button"
          >
            Mostrar Nuevas
          </button>
          <button
          onClick={()=> setShowNewOnly(false)}
          className="button"
          >
            Mostrar Todas
          </button>
        </div>
      </header>

      <main>
        {loading && <div className="loading">Cargando...</div>}
        {error && (
          <div className="error">
            <p>{error}</p>
            <button onClick={fetchOpportunities} className="retry-button">
              Reintentar
            </button>
          </div>
        )}
        
        <div className="opportunities-grid">
          {opportunities.map((opp) => (
            <div key={opp.id} className="opportunity-card">
              <h2>{opp.name}</h2>
              <div className="opportunity-details">
                <p><strong>Monto:</strong> ${opp.amount.toLocaleString()}</p>
                <p><strong>Etapa:</strong> {opp.stageName}</p>
                <p><strong>Probabilidad:</strong> {opp.probability}%</p>
                <p><strong>Cuenta:</strong> {opp.accountName}</p>
                <p><strong>Propietario:</strong> {opp.ownerName}</p>
                <p><strong>Creado:</strong> {new Date(opp.createdDate).toLocaleDateString()}</p>
                {opp.description && (
                  <p><strong>Descripción:</strong> {opp.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App; 