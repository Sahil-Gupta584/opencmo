import { addTodo, listTodos } from './todos'
import { getApiConfig, saveApiConfig } from './api-config'
import { listProjects, createProject, analyzeProduct, updateProject, refreshSubreddits, addSubreddit, removeSubreddit } from './projects'
import { fetchInbounds, listThreads, listThreadCounts, updateThreadStatus, generateThreadReply } from './inbounds'
import { getNotificationPref, saveNotificationPref } from './notifications'
import { createCheckout, getSubscription } from './billing'
import { runFetchCycle, runDailyContentCycle } from './cron'
import { listProjects as demoListProjects } from './demo'

export default {
  listTodos,
  addTodo,
  getApiConfig,
  saveApiConfig,
  listProjects,
  createProject,
  analyzeProduct,
  updateProject,
  refreshSubreddits,
  addSubreddit,
  removeSubreddit,
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
  runDailyContentCycle,
  demo: {
    listProjects: demoListProjects,
  },
}

