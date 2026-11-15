import { useRef, useState, type ChangeEvent } from 'react';
import { IconCalendar } from './icons';
import { isoATexto, textoAIso } from '../utils/fechas';
import './CampoFecha.css';

interface Props {
  /** AAAA-MM-DD o '' (sin fecha). */
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  id?: string;
}

/** Inserta las barras mientras se tipea: 15112026 → 15/11/2026. */
function enmascarar(entrada: string): string {
  const digitos = entrada.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/**
 * Campo de fecha en DD/MM/AAAA. El input type="date" del navegador muestra el formato del sistema
 * operativo y no se puede forzar, por eso se tipea en texto y el calendario nativo queda detrás
 * del botón. Hacia afuera trabaja en ISO, igual que el input nativo al que reemplaza.
 */
export function CampoFecha({ value, onChange, min, max, id }: Props) {
  const [texto, setTexto] = useState(isoATexto(value));
  const [valorPrevio, setValorPrevio] = useState(value);
  const selector = useRef<HTMLInputElement>(null);

  // Si el valor cambia desde afuera (p. ej. "Limpiar filtros"), el texto lo acompaña.
  if (value !== valorPrevio) {
    setValorPrevio(value);
    if (textoAIso(texto) !== value) {
      setTexto(isoATexto(value));
    }
  }

  const iso = textoAIso(texto);
  const fueraDeRango = iso !== null && ((min && iso < min) || (max && iso > max));
  const invalida = texto.length === 10 && (iso === null || Boolean(fueraDeRango));

  function tipear(e: ChangeEvent<HTMLInputElement>) {
    const nuevo = enmascarar(e.target.value);
    setTexto(nuevo);
    if (nuevo === '') {
      onChange('');
      return;
    }
    const nuevoIso = textoAIso(nuevo);
    if (nuevoIso && !(min && nuevoIso < min) && !(max && nuevoIso > max)) {
      onChange(nuevoIso);
    }
  }

  function elegirEnCalendario(e: ChangeEvent<HTMLInputElement>) {
    setTexto(isoATexto(e.target.value));
    onChange(e.target.value);
  }

  return (
    <span className={`campo-fecha${invalida ? ' campo-fecha-invalida' : ''}`}>
      <input
        id={id}
        className="campo-fecha-texto"
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={texto}
        onChange={tipear}
        aria-invalid={invalida}
        title={invalida ? 'Fecha inválida o fuera de rango' : undefined}
      />
      <button
        type="button"
        className="campo-fecha-boton"
        aria-label="Elegir en el calendario"
        onClick={() => selector.current?.showPicker()}
      >
        <IconCalendar />
      </button>
      <input
        ref={selector}
        className="campo-fecha-selector"
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        min={min}
        max={max}
        onChange={elegirEnCalendario}
      />
    </span>
  );
}
