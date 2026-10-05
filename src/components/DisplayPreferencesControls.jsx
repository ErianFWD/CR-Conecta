import { Moon, Palette, Sun, Type } from 'lucide-react';
import {
  COLOR_VISION_TYPES,
  TEXT_SCALES,
  useDisplayPreferences
} from '../lib/useDisplayPreferences';

function PreferenceRow({ icon, label, description, state, active, onClick, title, children }) {
  return (
    <div className={`display-preference-block${active ? ' active' : ''}`}>
      <button
        type="button"
        className="display-preference-row"
        onClick={onClick}
        aria-pressed={active}
        title={title}
      >
        <span className="display-preference-icon">{icon}</span>
        <span className="display-preference-copy">
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
        {state && <span className="display-preference-state">{state}</span>}
        <span className={`display-switch${active ? ' on' : ''}`} aria-hidden="true">
          <i />
        </span>
      </button>
      {children}
    </div>
  );
}

function TextScalePicker({ value, onChange }) {
  return (
    <div className="display-scale-picker" role="group" aria-label="Tamaño de las letras">
      {TEXT_SCALES.map((scale, index) => {
        const active = scale.id === value;
        return (
          <button
            key={scale.id}
            type="button"
            className={`display-scale-option${active ? ' active' : ''}`}
            onClick={() => onChange(scale.id)}
            aria-pressed={active}
            title={`${scale.id} · ${Math.round(scale.value * 100)}% del tamaño original`}
          >
            <span className="display-scale-letter" style={{ fontSize: `${13 + index * 3}px` }}>
              A
            </span>
            <span className="display-scale-id">{scale.id}</span>
          </button>
        );
      })}
    </div>
  );
}

function ColorVisionPicker({ value, onChange, active }) {
  const selectedType = COLOR_VISION_TYPES.find(type => type.id === value) || COLOR_VISION_TYPES[0];

  return (
    <div className="display-vision-picker">
      <p className="display-vision-question">¿Qué tipo de daltonismo tenés?</p>

      <div className="display-vision-options" role="radiogroup" aria-label="Tipo de daltonismo">
        {COLOR_VISION_TYPES.map(type => {
          const selected = type.id === value;
          return (
            <button
              key={type.id}
              type="button"
              role="radio"
              aria-checked={selected && active}
              className={`display-vision-option${selected ? ' selected' : ''}`}
              onClick={() => onChange(type.id)}
              title={type.hint}
            >
              <span className="display-vision-check" aria-hidden="true" />
              <span className="display-vision-copy">
                <strong>{type.label}</strong>
                <small>{type.hint}</small>
              </span>
            </button>
          );
        })}
      </div>

      <p className="display-vision-preview-label">
        {active ? 'Paleta aplicada en este momento' : 'Paleta que se aplicará al activar el modo'}
      </p>
      <div className="display-vision-preview">
        {[
          ['primary', 'Primario'],
          ['secondary', 'Secundario'],
          ['success', 'Éxito'],
          ['warning', 'Aviso'],
          ['danger', 'Error']
        ].map(([token, label]) => (
          <span
            key={token}
            className="display-vision-swatch"
            style={{ background: selectedType.palette[token] }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DisplayPreferencesControls() {
  const {
    textScale,
    colorVision,
    isDark,
    isColorblind,
    toggleTheme,
    setTextScale,
    toggleColorVision,
    setColorVision
  } = useDisplayPreferences();

  const activeScale = TEXT_SCALES.find(scale => scale.id === textScale) || TEXT_SCALES[1];

  return (
    <div className="display-preferences">
      <PreferenceRow
        icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
        label="Modo oscuro"
        description="Reduce el brillo de la pantalla con un fondo oscuro."
        state={isDark ? 'Activado' : 'Desactivado'}
        active={isDark}
        onClick={toggleTheme}
        title={isDark ? 'Cambiar a modo claro' : 'Activar modo oscuro'}
      />

      <PreferenceRow
        icon={<Type size={18} />}
        label="Tamaño de las letras"
        description="Elegí un tamaño fijo. Se aplica a todo el sitio al instante."
        state={`${Math.round(activeScale.value * 100)}%`}
        active={textScale !== 'M'}
        onClick={() => setTextScale('M')}
        title="Volver al tamaño medio"
      >
        <TextScalePicker value={textScale} onChange={setTextScale} />
      </PreferenceRow>

      <PreferenceRow
        icon={<Palette size={18} />}
        label="Modo daltónico"
        description="Adapta los colores del sitio al tipo de daltonismo que indiques."
        state={isColorblind ? 'Activado' : 'Desactivado'}
        active={isColorblind}
        onClick={toggleColorVision}
        title={isColorblind ? 'Desactivar modo daltónico' : 'Activar modo daltónico'}
      >
        <ColorVisionPicker
          value={colorVision === 'default' ? 'deuteranopia' : colorVision}
          onChange={setColorVision}
          active={isColorblind}
        />
      </PreferenceRow>
    </div>
  );
}
