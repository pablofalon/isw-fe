import { useRef, useState, type DragEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconFile, IconTrash, IconUpload } from './icons';
import type { Categoria, LimitesAdjuntos, Prioridad } from '../types/ticket';
import './TicketForm.css';

const EXTENSIONES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx'];

interface TicketFormProps {
  categorias: Categoria[];
  prioridades: Prioridad[];
  limites: LimitesAdjuntos | null;
  onSubmit: (input: {
    titulo: string;
    descripcion: string;
    idCategoria: number;
    idPrioridadSugerida?: number;
    adjuntos: File[];
  }) => Promise<void>;
}

function extension(nombre: string): string {
  return nombre.slice(nombre.lastIndexOf('.') + 1).toLowerCase();
}

function formatoTamanio(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function TicketForm({ categorias, prioridades, limites, onSubmit }: TicketFormProps) {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idCategoria, setIdCategoria] = useState('');
  const [idPrioridad, setIdPrioridad] = useState('');
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    const nuevos = Array.from(files);
    const extensiones = limites?.extensionesPermitidas ?? EXTENSIONES_PERMITIDAS;
    const invalido = nuevos.find((f) => !extensiones.includes(extension(f.name)));
    if (invalido) {
      setError(`Formato no permitido: ${invalido.name}. Formatos válidos: JPG, PNG, PDF, DOCX, XLSX`);
      return;
    }
    if (limites) {
      const grande = nuevos.find((f) => f.size > limites.tamanioMaximoBytes);
      if (grande) {
        setError(`${grande.name} supera el tamaño máximo de ${formatoTamanio(limites.tamanioMaximoBytes)}.`);
        return;
      }
      if (adjuntos.length + nuevos.length > limites.maximoPorTicket) {
        setError(`Se pueden adjuntar hasta ${limites.maximoPorTicket} archivos por ticket.`);
        return;
      }
    }
    setError(null);
    setAdjuntos((prev) => [...prev, ...nuevos]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setArrastrando(false);
    handleFilesSelected(event.dataTransfer.files);
  }

  function quitarAdjunto(index: number) {
    setAdjuntos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        titulo,
        descripcion,
        idCategoria: Number(idCategoria),
        idPrioridadSugerida: idPrioridad ? Number(idPrioridad) : undefined,
        adjuntos,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ticket-form" onSubmit={handleSubmit}>
      <label htmlFor="titulo">Título del reclamo *</label>
      <input
        id="titulo"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Resumen breve del problema"
        required
      />

      <label htmlFor="categoria">Categoría *</label>
      <select id="categoria" value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)} required>
        <option value="">Seleccioná una categoría</option>
        {categorias.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nombre}
          </option>
        ))}
      </select>

      <label htmlFor="prioridad">Prioridad sugerida</label>
      <select id="prioridad" value={idPrioridad} onChange={(e) => setIdPrioridad(e.target.value)}>
        <option value="">Sin especificar</option>
        {prioridades.map((prioridad) => (
          <option key={prioridad.id} value={prioridad.id}>
            {prioridad.nivel}
          </option>
        ))}
      </select>

      <label htmlFor="descripcion">Descripción detallada *</label>
      <textarea
        id="descripcion"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Describí el problema con el mayor detalle posible"
        rows={6}
        required
      />

      <label htmlFor="adjuntos">Adjuntar archivo (opcional)</label>
      <div
        className={`ticket-form-dropzone${arrastrando ? ' ticket-form-dropzone-active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
      >
        <IconUpload />
        <p>Arrastrá y soltá archivos aquí</p>
        <span>o</span>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Seleccionar archivo
        </button>
        <input
          id="adjuntos"
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
          hidden
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />
        <small>
          Formatos permitidos: JPG, PNG, PDF, DOCX, XLSX
          {limites &&
            ` · Hasta ${limites.maximoPorTicket} archivos de ${formatoTamanio(limites.tamanioMaximoBytes)} como máximo`}
        </small>
      </div>

      {adjuntos.length > 0 && (
        <>
          <span className="ticket-form-adjuntos-titulo">Archivos adjuntos ({adjuntos.length})</span>
          <ul className="ticket-form-adjuntos">
            {adjuntos.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <span className="ticket-form-adjunto-nombre">
                  <IconFile />
                  {file.name}
                </span>
                <span className="ticket-form-adjunto-info">
                  {formatoTamanio(file.size)}
                  <button type="button" onClick={() => quitarAdjunto(index)} aria-label={`Quitar ${file.name}`}>
                    <IconTrash />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {error && <p className="ticket-form-error">{error}</p>}

      <div className="ticket-form-footer">
        <button type="button" className="ticket-form-cancelar" onClick={() => navigate('/')}>
          Cancelar
        </button>
        <button type="submit" className="ticket-form-enviar" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar Ticket'}
        </button>
      </div>
    </form>
  );
}
