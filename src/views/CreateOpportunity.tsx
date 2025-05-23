import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../App';

interface OpportunityFormData {
  name: string;
  amount: number | ''; // Permite cadena vacia. Facilita limpieza input
  stageName: string;
  closeDate: string;
  accountId: string; // Usa AccountId para envio
  description?: string;
}

interface Account {
  Id: string;
  Name: string;
}

const CreateOpportunity: React.FC = () => {
  const [formData, setFormData] = useState<OpportunityFormData>({
    name: '',
    amount: '', // Inicializa con cadena vacia
    stageName: '',
    closeDate: '',
    accountId: '', // Inicializa con cadena vacia
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [stageNames, setStageNames] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fetchOptionsLoading, setFetchOptionsLoading] = useState(true);
  const [fetchOptionsError, setFetchOptionsError] = useState<string | null>(null);


  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchOptionsLoading(true);
        // Fetch nombres estado 
        const stageNamesResponse = await fetch(`${API_BASE_URL}/api/opportunities/stagenames`);
        if (!stageNamesResponse.ok) {
          throw new Error(`Error fetching stage names: ${stageNamesResponse.statusText}`);
        }
        const stageNamesData: string[] = await stageNamesResponse.json();
        setStageNames(stageNamesData);

        // Fetch Cuentas
        console.log('Attempting to fetch accounts from:', `${API_BASE_URL}/api/opportunities/accounts`);
        const accountsResponse = await fetch(`${API_BASE_URL}/api/opportunities/accounts`); // Asume endpoint /api/opportunities/accounts
        console.log('Accounts fetch response status:', accountsResponse.status);
        if (!accountsResponse.ok) {
          throw new Error(`Error fetching accounts: ${accountsResponse.statusText}`);
        }
        const accountsData = await accountsResponse.json();
        console.log('Accounts data received:', accountsData);
        setAccounts(Array.isArray(accountsData) ? accountsData : []); // Cuentas en array
        // Asegurarse que respuesta sea array
        console.log('Accounts state updated with:', Array.isArray(accountsData) ? accountsData : []);

        setFetchOptionsError(null);
      } catch (err) {
        console.error('Error fetching options:', err);
        setFetchOptionsError(err instanceof Error ? err.message : 'Unknown error fetching options');
      } finally {
        console.log('Finished fetching options.');
        setFetchOptionsLoading(false);
      }
    };

    fetchOptions();
  }, []); // Array de dependencia vacio indica que efecto se ejecuta una vez al montar componente


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? value : value // Almacena importe como cadena inicialmente
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Valida que importe sea num valido antes de enviar
      const amountValue = parseFloat(formData.amount as string);
      if (isNaN(amountValue)) {
        throw new Error('Please enter a valid amount.');
      }

      // Asegurar que CloseDate tiene formato YYYY-MM-DD para Salesforce API
      const formattedFormData = {
        ...formData,
        amount: amountValue, // Envia num parseado a back
        closeDate: formData.closeDate ? new Date(formData.closeDate).toISOString().split('T')[0] : '',
        // Asegura que envie AccountId, no AccountName
        AccountId: formData.accountId // Usa AccountId de estado
      };
      // Elimina accountId de objeto enviado a back si back espera AccountId directamente
      delete (formattedFormData as any).accountId;


      const response = await fetch(`${API_BASE_URL}/api/opportunities`, { // Asumiendo que endpoint es /api/opportunities para POST
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedFormData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create opportunity');
      }

      // Asumiendo que éxito devuelve un estado 200 o 201
      console.log('Oportunidad creada con éxito:', await response.json());
      setSuccess(true);
      // Opcionalmente, limpia el formulario o redirige
      setFormData({
        name: '',
        amount: '', // Deja cadena vacia
        stageName: '',
        closeDate: '',
        accountId: '',
        description: ''
      });

    } catch (err) {
      console.error('Error creating opportunity:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-opportunity-container">
      <h1>Crear Nueva Oportunidad</h1>
      {fetchOptionsLoading && <p>Cargando opciones...</p>}
      {fetchOptionsError && <p style={{ color: 'red' }}>Error al cargar opciones: {fetchOptionsError}</p>}

      {loading && <p>Creating opportunity...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {success && <p style={{ color: 'green' }}>¡Oportunidad creada con éxito!</p>}

      {!fetchOptionsLoading && !fetchOptionsError && Array.isArray(accounts) && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre Oportunidad:</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Monto:</label>
            <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" />
          </div>
          <div className="form-group">
            <label htmlFor="stageName">Etapa:</label>
            <select id="stageName" name="stageName" value={formData.stageName} onChange={handleChange} required>
              <option value="">Selecciona la etapa:</option>
              {stageNames.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="closeDate">Fecha de cierre:</label>
            <input type="date" id="closeDate" name="closeDate" value={formData.closeDate} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="accountId">Nombre de la cuenta:</label>
            <select id="accountId" name="accountId" value={formData.accountId} onChange={handleChange} required>
              <option value="">Selecciona Cuenta</option>
              {Array.isArray(accounts) && accounts.map(account => (
                <option key={account.Id} value={account.Id}>{account.Name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">Descripción:</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange}></textarea>
          </div>
          <button type="submit" disabled={loading}>Crear Oportunidad</button>
        </form>
      )}
    </div>
  );
};

export default CreateOpportunity;
