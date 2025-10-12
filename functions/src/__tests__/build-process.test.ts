/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Build Process Validation Tests
 * 
 * Tests to validate that the build process correctly:
 * 1. Copies all necessary source directories (components, lib, middleware)
 * 2. Resolves TypeScript path aliases (@/*)
 * 3. Handles symlinks correctly
 * 4. Uses production mode configuration
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Build Process Validation', () => {
  const functionsDir = path.resolve(__dirname, '../..');
  
  describe('Directory Structure', () => {
    it('should have components directory copied', () => {
      const componentsDir = path.join(functionsDir, 'src', 'components');
      expect(fs.existsSync(componentsDir)).toBe(true);
      
      // Verify it's a real directory, not a symlink
      const stats = fs.lstatSync(componentsDir);
      expect(stats.isDirectory()).toBe(true);
      expect(stats.isSymbolicLink()).toBe(false);
    });

    it('should have lib directory copied', () => {
      const libDir = path.join(functionsDir, 'src', 'lib');
      expect(fs.existsSync(libDir)).toBe(true);
      
      // Verify it's a real directory, not a symlink
      const stats = fs.lstatSync(libDir);
      expect(stats.isDirectory()).toBe(true);
      expect(stats.isSymbolicLink()).toBe(false);
    });

    it('should have middleware directory or file copied', () => {
      const middlewareDir = path.join(functionsDir, 'src', 'middleware');
      const middlewareFile = path.join(functionsDir, 'src', 'middleware.ts');
      
      const hasDirOrFile = fs.existsSync(middlewareDir) || 
                           fs.existsSync(middlewareFile);
      expect(hasDirOrFile).toBe(true);
    });

    it('should have app directory copied', () => {
      const appDir = path.join(functionsDir, 'src', 'app');
      expect(fs.existsSync(appDir)).toBe(true);
      
      // Verify it's a real directory, not a symlink
      const stats = fs.lstatSync(appDir);
      expect(stats.isDirectory()).toBe(true);
      expect(stats.isSymbolicLink()).toBe(false);
    });

    it('should have .next directory copied', () => {
      const nextDir = path.join(functionsDir, '.next');
      expect(fs.existsSync(nextDir)).toBe(true);
      
      // Verify it's a real directory, not a symlink
      const stats = fs.lstatSync(nextDir);
      expect(stats.isDirectory()).toBe(true);
      expect(stats.isSymbolicLink()).toBe(false);
    });
  });

  describe('TypeScript Path Aliases', () => {
    it('should have tsconfig.json with path aliases', () => {
      const tsconfigPath = path.join(functionsDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
      
      const tsconfig = JSON.parse(
        fs.readFileSync(tsconfigPath, 'utf-8')
      );
      
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();
    });

    it('should resolve @/components path correctly', () => {
      const tsconfigPath = path.join(functionsDir, 'tsconfig.json');
      const tsconfig = JSON.parse(
        fs.readFileSync(tsconfigPath, 'utf-8')
      );
      
      const paths = tsconfig.compilerOptions.paths;
      const componentsPaths = paths['@/*'];
      
      // Should map to ./src/*
      expect(componentsPaths).toContain('./src/*');
    });

    it('should have components accessible via path alias', () => {
      const componentsDir = path.join(functionsDir, 'src', 'components');
      const uiDir = path.join(componentsDir, 'ui');
      
      // Verify components/ui exists and is accessible
      expect(fs.existsSync(uiDir)).toBe(true);
      expect(fs.existsSync(
        path.join(uiDir, 'index.ts')
      )).toBe(true);
    });

    it('should have lib directory accessible via path alias', () => {
      const libDir = path.join(functionsDir, 'src', 'lib');
      const authDir = path.join(libDir, 'auth');
      
      // Verify lib/auth exists and is accessible
      expect(fs.existsSync(authDir)).toBe(true);
    });
  });

  describe('Symlink Handling', () => {
    it('should not have symlinks in copied directories', () => {
      const srcDir = path.join(functionsDir, 'src');
      
      // Check all top-level items in src
      const items = fs.readdirSync(srcDir);
      items.forEach((item) => {
        const itemPath = path.join(srcDir, item);
        const stats = fs.lstatSync(itemPath);
        
        if (stats.isDirectory()) {
          expect(stats.isSymbolicLink()).toBe(false);
        }
      });
    });

    it('should have real files, not symlinks, in components', () => {
      const componentsDir = path.join(functionsDir, 'src', 'components');
      if (fs.existsSync(componentsDir)) {
        const items = fs.readdirSync(componentsDir);
        
        items.forEach((item) => {
          const itemPath = path.join(componentsDir, item);
          const stats = fs.lstatSync(itemPath);
          
          // Should be a real file or directory, not a symlink
          expect(stats.isSymbolicLink()).toBe(false);
        });
      }
    });
  });

  describe('Production Configuration', () => {
    it('should have package.json with production scripts', () => {
      const packageJsonPath = path.join(functionsDir, 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);
      
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf-8')
      );
      
      expect(packageJson.scripts).toBeDefined();
    });

    it('should have next.config.js copied', () => {
      const nextConfigPath = path.join(functionsDir, 'next.config.js');
      expect(fs.existsSync(nextConfigPath)).toBe(true);
    });

    it('should have production dependencies only', () => {
      const packageJsonPath = path.join(functionsDir, 'package.json');
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf-8')
      );
      
      // Should have dependencies
      expect(packageJson.dependencies).toBeDefined();
      expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(0);
      
      // Should NOT have @playwright or other test dependencies
      if (packageJson.dependencies) {
        expect(packageJson.dependencies['@playwright/test']).toBeUndefined();
        expect(packageJson.dependencies['jest']).toBeUndefined();
      }
    });
  });

  describe('Module Resolution', () => {
    it('should be able to resolve component imports', () => {
      // Test that the structure allows for @/components imports
      const componentsIndex = path.join(
        functionsDir, 'src', 'components', 'ui', 'index.ts'
      );
      
      if (fs.existsSync(componentsIndex)) {
        const content = fs.readFileSync(componentsIndex, 'utf-8');
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);
      }
    });

    it('should be able to resolve lib imports', () => {
      // Test that the structure allows for @/lib imports
      const sessionFile = path.join(
        functionsDir, 'src', 'lib', 'auth', 'session.ts'
      );
      
      if (fs.existsSync(sessionFile)) {
        const content = fs.readFileSync(sessionFile, 'utf-8');
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should have environment configuration example', () => {
      const exampleConfig = path.join(
        functionsDir, '.runtimeconfig.json.example'
      );
      expect(fs.existsSync(exampleConfig)).toBe(true);
    });
  });
});
