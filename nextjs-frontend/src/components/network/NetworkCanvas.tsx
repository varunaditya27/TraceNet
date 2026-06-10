'use client'
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { initGraph, nodeRadius } from '@/lib/d3-graph'
import type { GraphData, GraphNode } from '@/lib/graph-data'

interface Props {
  data: GraphData
  onNodeSelect: (node: GraphNode | null) => void
  hiddenRoles: Set<string>
  hiddenGrams: Set<string>
  showComponents: boolean
}

export function NetworkCanvas({ data, onNodeSelect, hiddenRoles, hiddenGrams, showComponents }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    initGraph(svgRef.current, data)

    const svg = d3.select(svgRef.current)

    // Make nodes larger (1.4×)
    svg.selectAll<SVGCircleElement, unknown>('.node-circle')
      .attr('r', function() {
        const id = Number(d3.select(this).attr('data-id'))
        return nodeRadius(data.nodes[id]) * 1.4
      })
      .style('cursor', 'pointer')
      .on('click', function() {
        const id = Number(d3.select(this).attr('data-id'))
        onNodeSelect(data.nodes[id])
      })
  }, [data, onNodeSelect])

  // Apply filters
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)

    data.nodes.forEach(node => {
      const hidden = hiddenRoles.has(node.role) || hiddenGrams.has(node.gram)
      svg.select(`#n-${node.id}`).transition().duration(200).attr('opacity', hidden ? 0.05 : 1)
      svg.select(`#lbl-${node.id}`).transition().duration(200).attr('opacity', hidden ? 0 : 1)
    })

    if (showComponents) {
      // Dim cross-component edges
      const scc = data.algorithms.scc
      svg.selectAll('.edge-line').each(function() {
        const el = d3.select(this)
        const src = Number(el.attr('data-src'))
        const tgt = Number(el.attr('data-tgt'))
        const crossComponent = scc.component_of[src] !== scc.component_of[tgt]
        el.transition().duration(200).attr('opacity', crossComponent ? 0.02 : 0.4)
      })
    } else {
      svg.selectAll('.edge-line').each(function() {
        const el = d3.select(this)
        const w = Number(el.attr('data-weight'))
        el.transition().duration(200).attr('opacity', 0.15 + w * 0.55)
      })
    }
  }, [data, hiddenRoles, hiddenGrams, showComponents])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--surface-0)' }}>
      <div className="dot-grid" />
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
        viewBox="0 0 1140 670"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  )
}
