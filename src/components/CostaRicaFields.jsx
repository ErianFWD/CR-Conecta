import { useEffect, useId, useRef, useState } from 'react';
import { emptyLocation, getProvinces, getCantons, getDistricts, getIdentity } from '../services/costaRica';

function useOptions(loader, parent) {
  const [result, setResult] = useState({ rows: [], loading: false, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (parent === '') return;
    const controller = new AbortController();
    loader(parent, controller.signal).then(rows => {
      if (!controller.signal.aborted) setResult({ rows, loading: false, error: '', parent });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ rows: [], loading: false, error: error.message, parent });
    });
    return () => controller.abort();
  }, [loader, parent, retry]);
  return { ...(result.parent === parent ? result : { rows: [], loading: parent !== '', error: '' }), retry: () => setRetry(value => value + 1) };
}
const provincesLoader = (_parent, signal) => getProvinces(signal);

export function CostaRicaFields({ value, onChange, nameField = 'name', required = true }) {
  const id = useId();
  const location = value.location || emptyLocation;
  const provinces = useOptions(provincesLoader, 'all');
  const cantons = useOptions(getCantons, location.provinceId);
  const districts = useOptions(getDistricts, location.cantonId);
  const [status, setStatus] = useState({ loading: false, text: '' });
  const lookup = useRef(null);
  useEffect(() => () => lookup.current?.abort(), []);
  const identify = async () => {
    const identification = (value.identification || '').replace(/[\s-]/g, '');
    if (!/^\d{9,12}$/.test(identification)) { setStatus({ loading: false, text: 'Escribí de 9 a 12 dígitos.' }); return; }
    lookup.current?.abort();
    const controller = new AbortController();
    lookup.current = controller;
    setStatus({ loading: true, text: 'Consultando Hacienda…' });
    try {
      const result = await getIdentity(identification, controller.signal);
      if (!controller.signal.aborted) {
        onChange({ identification, [nameField]: result.name });
        setStatus({ loading: false, text: `Nombre encontrado: ${result.name}. Revisá que corresponda a la persona o entidad.` });
      }
    } catch (error) {
      if (!controller.signal.aborted) setStatus({ loading: false, text: `${error.message} Podés completar el nombre manualmente.` });
    }
  };
  const choose = (kind, selected, rows) => {
    const row = rows.find(item => item.id === selected);
    let next = { ...location };
    if (kind === 'province') next = { ...emptyLocation, provinceId: row?.id || '', province: row?.name || '' };
    if (kind === 'canton') next = { ...location, cantonId: row?.id || '', canton: row?.name || '', districtId: '', district: '' };
    if (kind === 'district') next = { ...location, districtId: row?.id || '', district: row?.name || '' };
    onChange({ location: next, zone: next.district || next.canton || '' });
  };
  return <fieldset className="cr-fields">
    <legend>Identificación y ubicación en Costa Rica</legend>
    <label htmlFor={`${id}-identification`}>Cédula {required && '*'}</label>
    <div className="identity-lookup">
      <input id={`${id}-identification`} inputMode="numeric" required={required} pattern="[0-9]{9,12}" maxLength={12}
        value={value.identification || ''} onChange={event => {
          lookup.current?.abort(); setStatus({ loading: false, text: '' });
          onChange({ identification: event.target.value.replace(/\D/g, '') });
        }} aria-describedby={`${id}-identity-help`} />
      <button type="button" className="btn secondary" onClick={identify} disabled={status.loading}>Consultar Hacienda</button>
    </div>
    <small id={`${id}-identity-help`}>La consulta completa el nombre cuando existe en Hacienda. No verifica la identidad de quien se registra.</small>
    {status.text && <p className="cr-field-status" role="status">{status.text}</p>}
    <div className="cr-location-grid">
      {[
        { kind: 'province', title: 'Provincia', options: provinces, disabled: false, needed: required },
        { kind: 'canton', title: 'Cantón', options: cantons, disabled: !location.provinceId, needed: required },
        { kind: 'district', title: 'Distrito (opcional)', options: districts, disabled: !location.cantonId, needed: false }
      ].map(({ kind, title, options, disabled, needed }) => <div key={kind}>
        <label htmlFor={`${id}-${kind}`}>{title}{needed && ' *'}</label>
        <select id={`${id}-${kind}`} required={needed} disabled={disabled}
          value={location[`${kind}Id`]} onChange={event => choose(kind, event.target.value, options.rows)}>
          <option value="">{options.loading ? 'Cargando…' : 'Seleccionar…'}</option>
          {options.rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
        {options.error && <div role="alert"><small>{options.error}</small><button className="btn secondary" type="button" onClick={options.retry}>Reintentar</button></div>}
      </div>)}
    </div>
  </fieldset>;
}
