'use client'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { initGraph } from '@/lib/d3-graph'
import { useDemoStore } from '@/store/demo-store'
import { NodeTooltip } from './NodeTooltip'
import { ALGORITHM_MODULES } from '@/lib/algorithms'
import type { GraphData, GraphNode } from '@/lib/graph-data'

export function GraphCanvas({ data }: { data: GraphData }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeAlgoRef = useRef<string>('')
  const { selectedAlgo, currentStep, setTotalSteps } = useDemoStore()
  const [tooltip, setTooltip] = useState<{ node: GraphNode; x: number; y: number } | null>(null)

  // Init graph once on mount
  useEffect(() => {
    if (!svgRef.current) return
    initGraph(svgRef.current, data)
    const svg = d3.select(svgRef.current)
    svg.selectAll<SVGCircleElement, unknown>('.node-circle')
      .on('mouseenter', function (event: MouseEvent) {
        const id = Number(d3.select(this).attr('data-id'))
        const node = data.nodes[id]
        if (!node || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setTooltip({ node, x: event.clientX - rect.left, y: event.clientY - rect.top })
      })
      .on('mouseleave', () => setTooltip(null))
  }, [data])

  // Switch algorithm
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current) as d3.Selection<SVGSVGElement, unknown, null, undefined>
    const prev = activeAlgoRef.current
    if (prev && ALGORITHM_MODULES[prev]) {
      try { ALGORITHM_MODULES[prev].exit(svg, data) } catch {}
    }
    activeAlgoRef.current = selectedAlgo
    const mod = ALGORITHM_MODULES[selectedAlgo]
    if (!mod) return
    setTotalSteps(mod.steps.length)
    try { mod.enter(svg, data, 0) } catch {}
  }, [selectedAlgo, data, setTotalSteps])

  // Step change
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current) as d3.Selection<SVGSVGElement, unknown, null, undefined>
    const mod = ALGORITHM_MODULES[selectedAlgo]
    if (!mod) return
    try { mod.enter(svg, data, currentStep) } catch {}
  }, [currentStep, selectedAlgo, data])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--surface-0)', overflow: 'hidden' }}>
      <div className="dot-grid" />
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
        viewBox="0 0 1140 670"
        preserveAspectRatio="xMidYMid meet"
      />
      {tooltip && <NodeTooltip node={tooltip.node} position={{ x: tooltip.x, y: tooltip.y }} />}
    </div>
  )
}
