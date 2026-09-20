import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createBackendContainer } from '@hydra/backend-core'
import type { SortKey, AdvancedFilters } from '@hydra/backend-core'

const backendContainer = createBackendContainer()
const app = new Hono()

app.use('*', cors())

app.get('/', (c) => c.text('Hydra API is running!'))

const apiRoutes = new Hono()
  .post('/games/paginated', async (c) => {
    try {
      const body = await c.req.json<{
        limit?: number
        offset?: number
        search?: string
        filters?: AdvancedFilters
        sort?: SortKey
        sortDirection?: 'asc' | 'desc'
      }>()
      const result = await backendContainer.getGamesPaginatedUseCase.execute(body)
      if (result.isSuccess) {
        return c.json({ success: true, data: result.getValue() })
      }
      return c.json({ success: false, error: result.getError().message }, 500)
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })
  .get('/games/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10)
      const result = await backendContainer.getGameByIdUseCase.execute(id)
      if (result.isSuccess) {
        return c.json({ success: true, data: result.getValue() })
      }
      return c.json({ success: false, error: result.getError().message }, 404)
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })
  .get('/filters', async (c) => {
    try {
      const result = await backendContainer.getFilterOptionsUseCase.execute()
      if (result.isSuccess) {
        return c.json({ success: true, data: result.getValue() })
      }
      return c.json({ success: false, error: result.getError().message }, 500)
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })

const routes = app.route('/api', apiRoutes)

export type AppType = typeof routes

const port = 3001
console.log(`Server is running on port ${port}`)
serve({ fetch: app.fetch, port })
