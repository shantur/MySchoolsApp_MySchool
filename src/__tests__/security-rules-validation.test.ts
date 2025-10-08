/**
 * Firebase Security Rules Validation Tests
 * 
 * These tests validate that the Firebase Security Rules files exist
 * and contain the expected structure and content.
 * 
 * @jest-environment node
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Firebase Security Rules Validation', () => {
  const projectRoot = path.join(__dirname, '../..');
  
  describe('Firestore Rules', () => {
    const firestoreRulesPath = path.join(projectRoot, 'firestore.rules');
    
    test('should exist', () => {
      expect(fs.existsSync(firestoreRulesPath)).toBe(true);
    });
    
    test('should contain correct rules version', () => {
      const rules = fs.readFileSync(firestoreRulesPath, 'utf8');
      expect(rules).toContain("rules_version = '2';");
      expect(rules).toContain('service cloud.firestore');
    });
    
    test('should protect schools collection', () => {
      const rules = fs.readFileSync(firestoreRulesPath, 'utf8');
      expect(rules).toContain('match /schools/{schoolId}');
      expect(rules).toContain('allow read, write: if request.auth.token.admin == true;');
    });
    
    test('should protect users collection', () => {
      const rules = fs.readFileSync(firestoreRulesPath, 'utf8');
      expect(rules).toContain('match /users/{userId}');
      expect(rules).toContain('allow read, write: if request.auth.token.admin == true;');
    });
    
    test('should protect groups collection', () => {
      const rules = fs.readFileSync(firestoreRulesPath, 'utf8');
      expect(rules).toContain('match /groups/{groupId}');
      expect(rules).toContain('allow read, write: if request.auth.token.admin == true;');
    });
    
    test('should protect notices collection', () => {
      const rules = fs.readFileSync(firestoreRulesPath, 'utf8');
      expect(rules).toContain('match /notices/{noticeId}');
      expect(rules).toContain('allow read, write: if request.auth.token.admin == true;');
    });
  });
  
  describe('Storage Rules', () => {
    const storageRulesPath = path.join(projectRoot, 'storage.rules');
    
    test('should exist', () => {
      expect(fs.existsSync(storageRulesPath)).toBe(true);
    });
    
    test('should contain correct rules version', () => {
      const rules = fs.readFileSync(storageRulesPath, 'utf8');
      expect(rules).toContain("rules_version = '2';");
      expect(rules).toContain('service firebase.storage');
    });
    
    test('should protect attachments storage', () => {
      const rules = fs.readFileSync(storageRulesPath, 'utf8');
      expect(rules).toContain('match /attachments/{schoolId}/{noticeId}/{filename}');
      expect(rules).toContain('allow read, write: if request.auth.token.admin == true;');
    });
  });
  
  describe('Firebase Configuration', () => {
    const firebaseConfigPath = path.join(projectRoot, 'firebase.json');
    
    test('should reference firestore rules', () => {
      const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      expect(config.firestore.rules).toBe('firestore.rules');
    });
    
    test('should reference storage rules', () => {
      const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      expect(config.storage.rules).toBe('storage.rules');
    });
  });
  
  describe('Security Rules Content Analysis', () => {
    test('should only allow admin access to all collections', () => {
      const firestoreRules = fs.readFileSync(
        path.join(projectRoot, 'firestore.rules'), 
        'utf8'
      );
      
      // Ensure no non-admin access patterns exist
      expect(firestoreRules).not.toContain('if request.auth != null');
      expect(firestoreRules).not.toContain('if request.auth.uid != null');
      expect(firestoreRules).not.toContain('if resource.data.userId == request.auth.uid');
      
      // Ensure admin-only pattern is consistent
      const adminAccessCount = (firestoreRules.match(/request\.auth\.token\.admin == true/g) || []).length;
      expect(adminAccessCount).toBeGreaterThanOrEqual(4); // At least 4 collections
    });
    
    test('should only allow admin access to storage', () => {
      const storageRules = fs.readFileSync(
        path.join(projectRoot, 'storage.rules'), 
        'utf8'
      );
      
      // Ensure no non-admin access patterns exist
      expect(storageRules).not.toContain('if request.auth != null');
      expect(storageRules).not.toContain('if request.auth.uid != null');
      
      // Ensure admin-only pattern is present
      expect(storageRules).toContain('request.auth.token.admin == true');
    });
  });
});