import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// استيراد التطبيق الرئيسي
import { createApp } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let app: express.Application;

// إنشاء التطبيق مرة واحدة
const getApp = async () => {
  if (!app) {
    app = await createApp();
  }
  return app;
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const expressApp = await getApp();
  
  // تحويل Netlify Event إلى Express Request
  const req = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers,
    body: event.body,
    query: event.queryStringParameters || {},
    params: {},
    ...event
  };

  const res = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: '',
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.body = JSON.stringify(data);
      this.headers['Content-Type'] = 'application/json';
      return this;
    },
    send: function(data: any) {
      if (typeof data === 'object') {
        this.body = JSON.stringify(data);
        this.headers['Content-Type'] = 'application/json';
      } else {
        this.body = data;
      }
      return this;
    },
    setHeader: function(name: string, value: string) {
      this.headers[name] = value;
      return this;
    }
  };

  return new Promise((resolve) => {
    // محاكاة Express middleware
    const mockNext = () => {};
    
    // تشغيل Express middleware stack
    try {
      expressApp(req as any, res as any, mockNext);
      
      // انتظار انتهاء المعالجة
      setTimeout(() => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: res.body
        });
      }, 100);
      
    } catch (error) {
      console.error('Error in Netlify handler:', error);
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      });
    }
  });
};