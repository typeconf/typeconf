"use client";

import * as React from 'react';
import { once } from 'lodash';

const createTypeconfContext = once(<T,>() => React.createContext<T | null>(null));

export function useTypeconf<T>() {
  const config = React.useContext(createTypeconfContext<T>());
  if (!config) {
    throw new Error('useTypeconf must be used within a TypeconfProvider');
  }
  return config;
}

export interface TypeconfProviderProps<T> {
  config: T;
  children: React.ReactNode;
}

export function TypeconfProvider<T>({ config, children }: TypeconfProviderProps<T>) {
  const ConfigContext = createTypeconfContext<T>();
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
} 
