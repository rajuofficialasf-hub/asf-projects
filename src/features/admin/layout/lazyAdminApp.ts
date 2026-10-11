import { lazy } from 'react'

/** পুরো এডমিন (AdminApp.tsx) একটি lazy চাংক; পাবলিক রাউট-টেবিল শুধু এটুকুই ইমপোর্ট করে */
export const LazyAdminApp = lazy(() => import('./AdminApp'))
