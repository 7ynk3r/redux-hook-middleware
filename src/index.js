// hooking Middleware

export const hooks = {}

/**
 * register dispatch hook
 * @param  {'pre'|'post'} position define pre or post hook
 * @param  {string}       type     action type
 * @param  {function}     hook     hook
 * @return {false|symbol}          return hook id or false when failed
 */
export const registerHook = (position, type, hook) => {
  if (typeof position !== 'string') {
    return false
  }
  if (typeof type !== 'string') {
    return false
  }
  if (typeof hook !== 'function') {
    return false
  }

  if (!hooks[type]) {
    hooks[type] = []
  }

  const id = Symbol(type)
  hooks[type].push({ position, id, hook })

  return id
}

/**
 * curried hooking function
 * @param  {string}   type action type
 * @param  {function} hook hook
 * @return {function}      curried register function
 */
export const registerPrehook = (type, hook) => {
  return registerHook('pre', type, hook)
}

/**
* curried hooking function
 * @param  {string}   type action type
 * @param  {function} hook hook
 * @return {function}      curried register function
 */
export const registerPosthook = (type, hook) => {
  return registerHook('post', type, hook)
}

/**
 * registerPrehooks
 * @param  {'pre'|'post'} position define pre or post hook
 * @param  {object} structTypes type: <Array<Function>> or <Function>
 * @return {object}             ids
 */
export const registerHooks = (position, structTypes) => {

  if (typeof position !== 'string') {
    return false
  }
  if (typeof structTypes !== 'object') {
    return false
  }

  const result = {}

  Object.keys(structTypes).forEach(type => {
    const hooks = structTypes[type]
    if (typeof hooks === 'function') {
      result[type] = [registerHook(position, type, hooks)]
    } else if (Array.isArray(hooks)) {
      result[type] = hooks.map(hook => (typeof hook === 'function') ?
        registerHook(position, type, hook) : void 0)
    } else {
      result[type] = void 0
    }
  })

  return result
}

/**
 * register Prehooks
 * @param  {object} structTypes type: <Array<Function>> or <Function>
 * @return {object}             ids
 */
export const registerPrehooks = structTypes => {
  return registerHooks('pre', structTypes)
}

/**
 * register Prehooks
 * @param  {object} structTypes type: <Array<Function>> or <Function>
 * @return {object}             ids
 */
export const registerPosthooks = structTypes => {
  return registerHooks('post', structTypes)
}
/**
 * unregister dispatch hook
 * @param  {symbol} id given hook
 * @return {void}
 */
export const unregisterHook = id => {
  Object.keys(hooks).forEach(type => {
    hooks[type] = hooks[type].filter(x => x.id !== id)
  })
}

/**
 * clear all hooks
 * @return {void}
 */
export const clearHooks = () => {
  Object.keys(hooks).forEach(type => {
    delete hooks[type]
  })
}

/**
 * Redux Middleware to chain api call
 * @param  {Store}      store  Redux store
 * @param  {Middleware} next   next middlwware
 * @param  {Action}     action dispatched action
 * @return {void}
 */
export default store => next => action => {
  /**
   * [getTheHooksAt description]
   * @param  {'pre'|'post'}     position determine pre or post
   * @return {array<function>}           hooks
   */
  const getTheHooksAt = position => action && hooks[action.type] ? (
    hooks[action.type]
    .filter(x => x.position === position)
    .map(x => x.hook)
  ) : []
  const prehooks  = getTheHooksAt('pre')
  const posthooks =  getTheHooksAt('post')

  prehooks.forEach(hook => hook(store, action))
  const result = next(action)
  posthooks.forEach(hook => hook(store, action))
  return result
}
