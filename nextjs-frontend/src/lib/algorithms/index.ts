import type { GraphData } from '@/lib/graph-data'
import type * as d3 from 'd3'
import { bfsModule } from './bfs'
import { sccModule } from './scc'
import { topoModule } from './topo'
import { boyerMooreModule } from './boyer-moore'

export interface StepDef {
  label: string
  detail: string
}

export interface AlgorithmModule {
  steps: StepDef[]
  enter: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: GraphData, step: number) => void
  exit: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: GraphData) => void
  getResults: (data: GraphData) => { label: string; value: string }[]
}

export const ALGORITHM_MODULES: Record<string, AlgorithmModule> = {
  bfs: bfsModule,
  scc: sccModule,
  topo_sort: topoModule,
  boyer_moore: boyerMooreModule,
}
