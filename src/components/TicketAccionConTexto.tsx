import { useState } from 'react';
import './TicketAccionConTexto.css';

interface Props {
  titulo: string;
  placeholder: string;
  etiquetaBoton: string;
  variante?: 'primario' | 'peligro';
  onConfirmar: (texto: string) => Promise<void>;
}

export function TicketAccionConTexto({ titulo, placeholder, etiquetaBoton, variante = 'primario', onConfirmar }: Props) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setError(null);
    setSubmitting(true);
    try {
      await onConfirmar(texto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`accion-con-texto accion-${variante}`}>
      <h4>{titulo}</h4>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
      {error && <p className="accion-con-texto-error">{error}</p>}
      <button onClick={handleClick} disabled={submitting}>
        {submitting ? 'Enviando...' : etiquetaBoton}
      </button>
    </div>
  );
}
