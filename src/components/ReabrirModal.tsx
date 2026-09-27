import { useState } from 'react';
import { IconClose, IconInfo, IconWarning } from './icons';
import './ReabrirModal.css';

const MAX_LARGO = 1000;

interface Props {
  ticketNumero: string;
  titulo?: string;
  onCancelar: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
}

export function ReabrirModal({ ticketNumero, titulo = 'Reabrir Ticket', onCancelar, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      await onConfirmar(motivo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reabrir el ticket.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="reabrir-modal-overlay" onClick={onCancelar}>
      <div className="reabrir-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reabrir-modal-header">
          <h3>{titulo}</h3>
          <button type="button" className="reabrir-modal-cerrar" onClick={onCancelar} aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        <div className="reabrir-modal-aviso">
          <IconWarning size={20} />
          <p>
            Está por reabrir el ticket #{ticketNumero}. Por favor, indique el motivo de la reapertura.
          </p>
        </div>

        <label htmlFor="motivo-reapertura">Motivo de reapertura *</label>
        <span className="reabrir-modal-ayuda">Explique brevemente por qué la solución no fue satisfactoria.</span>
        <textarea
          id="motivo-reapertura"
          rows={4}
          maxLength={MAX_LARGO}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: El problema persiste al intentar ingresar nuevamente..."
        />
        <span className="reabrir-modal-contador">
          {motivo.length}/{MAX_LARGO}
        </span>

        <div className="reabrir-modal-info">
          <IconInfo size={18} />
          <p>El ticket volverá al estado REABIERTO y el operador será notificado.</p>
        </div>

        {error && <p className="reabrir-modal-error">{error}</p>}

        <div className="reabrir-modal-footer">
          <button type="button" className="reabrir-modal-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="reabrir-modal-confirmar"
            disabled={!motivo.trim() || enviando}
            onClick={confirmar}
          >
            {enviando ? 'Enviando...' : 'Confirmar reapertura'}
          </button>
        </div>
      </div>
    </div>
  );
}
