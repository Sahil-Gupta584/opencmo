import { addTodo, listTodos } from './todos'
import { getApiConfig, saveApiConfig } from './api-config'
import { listProjects, createProject, analyzeProduct, updateProject, refreshSubreddits, addSubreddit, removeSubreddit } from './projects'
import { fetchInbounds, listThreads, listThreadCounts, updateThreadStatus, generateThreadReply } from './inbounds'
import { getNotificationPref, saveNotificationPref } from './notifications'
import { getMentionsInterest, saveMentionsInterest, getAlertPref, saveAlertPref } from './prefs'
import { createCheckout, getSubscription } from './billing'
import { runFetchCycle, runDailyContentCycle } from './cron'
import { listProjects as demoListProjects, testDb } from './demo'

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
  getMentionsInterest,
  saveMentionsInterest,
  getAlertPref,
  saveAlertPref,
  createCheckout,
  getSubscription,
  runFetchCycle,
  runDailyContentCycle,
  demo: {
    listProjects: demoListProjects,
    testDb,
  },
}

