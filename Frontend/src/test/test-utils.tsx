import React, { type PropsWithChildren } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, type PreloadedState } from '@reduxjs/toolkit';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { apiSlice } from '@/app/apiSlice';
import authReducer from '@/features/auth/authSlice';
import cartReducer from '@/features/cart/cartSlice';

export type RootState = {
  api: ReturnType<typeof apiSlice.reducer>;
  auth: ReturnType<typeof authReducer>;
  cart: ReturnType<typeof cartReducer>;
};

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  routerProps?: MemoryRouterProps;
}

export function createTestStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,
      cart: cartReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState,
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    routerProps = { initialEntries: ['/'] },
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const store = createTestStore(preloadedState);

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <Provider store={store}>
        <MemoryRouter {...routerProps}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
