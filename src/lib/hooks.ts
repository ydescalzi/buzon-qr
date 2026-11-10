import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { Area, Config } from '../types';

export function useConfig() {
  const [config, setConfig] = useState<Config>({ empresa: '', publicUrl: '', logo: '' });
  useEffect(() => {
    api.get<Config>('/config').then(setConfig).catch(() => undefined);
  }, []);
  return { config, setConfig };
}

export const getInstitutionLogo = (config: Pick<Config, 'logo'>) =>
  config.logo || '/usmp-logo.png';

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    api
      .get<Area[]>('/areas')
      .then(setAreas)
      .finally(() => setLoading(false));
  }, []);
  useEffect(reload, [reload]);
  return { areas, loading, reload };
}

/** URL base que va dentro de los QR. Si está en localhost, el celular no podrá abrirla. */
export function publicBase(config: Config) {
  return (config.publicUrl?.trim() || window.location.origin).replace(/\/+$/, '');
}

export function isLocalhost(url: string) {
  return /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);
}

export const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
