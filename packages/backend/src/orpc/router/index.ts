import { addTodo, listTodos } from './todos'
import { getApiConfig, saveApiConfig } from './api-config'
import { listProjects, createProject, analyzeProduct, generateDraft, refreshSubreddits } from './projects'
import { fetchInbounds, listThreads, listThreadCounts, updateThreadStatus, generateThreadReply } from './inbounds'
import { getNotificationPref, saveNotificationPref } from './notifications'
import { createCheckout, getSubscription } from './billing'
import { runFetchCycle } from './cron'

export default {
  listTodos,
  addTodo,
  getApiConfig,
  saveApiConfig,
  listProjects,
  createProject,
  analyzeProduct,
  generateDraft,
  refreshSubreddits,
  fetchInbounds,
  listThreads,
  listThreadCounts,
  updateThreadStatus,
  generateThreadReply,
  getNotificationPref,
  saveNotificationPref,
  createCheckout,
  getSubscription,
  runFetchCycle,
}

