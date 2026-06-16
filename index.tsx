
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from './src/app.component';
import { routes } from './src/app.routes';
import './src/styles.css';

async function startApp() {
  if (import.meta.env.DEV) {
    await import('@angular/compiler');
    const angularCore = await import('@angular/core');
    const resolveComponentResources = (
      angularCore as typeof angularCore & Record<string, unknown>
    )['\u0275resolveComponentResources'] as (resolver: (url: string) => Promise<string>) => Promise<void>;

    await resolveComponentResources((url) => {
      const resourceUrl = url === './app.component.html' ? '/src/app.component.html' : url;
      return fetch(resourceUrl).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load Angular resource: ${resourceUrl}`);
        }
        return response.text();
      });
    });
  }

  await bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideRouter(routes, withHashLocation())
    ]
  });
}

startApp().catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
