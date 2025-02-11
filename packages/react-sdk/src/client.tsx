import * as React from 'react';
import { once } from 'lodash';

const createTypeconfContext = once(<T,>() => React.createContext<T | null>(null));

export function useTypeconf<T>() {
  const config = React.useContext(createTypeconfContext<T>());
  if (!config) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return config;
}

export interface ConfigProviderProps<T> {
  config: T;
  children: React.ReactNode;
}

export function ConfigProvider<T>({ config, children }: ConfigProviderProps<T>) {
  const ConfigContext = createTypeconfContext<T>();
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
} 