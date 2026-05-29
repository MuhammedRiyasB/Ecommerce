import React, { type PropsWithChildren } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { apiSlice } from '@/app/apiSlice';
import authReducer from '@/features/auth/authSlice';
import cartReducer from '@/features/cart/cartSlice';

const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  cart: cartReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  routerProps?: MemoryRouterProps;
}

export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
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
