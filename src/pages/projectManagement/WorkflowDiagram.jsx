import React, { useCallback, useEffect } from 'react'
import { Card, Button, Space, Switch, message } from 'antd'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useDispatch, useSelector } from 'react-redux'
import { updateWorkflow, setEditable } from '../../features/projectManagement/workflowSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const WorkflowDiagram = () => {
  const dispatch = useDispatch()
  const { workflow, editable } = useSelector((state) => state.workflow)
  const { user } = useSelector((state) => state.auth)
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    setNodes(workflow.nodes)
    setEdges(workflow.edges)
  }, [workflow, setNodes, setEdges])

  const onConnect = useCallback(
    (params) => {
      if (editable) {
        setEdges((eds) => addEdge(params, eds))
      }
    },
    [editable, setEdges]
  )

  const handleSave = () => {
    dispatch(updateWorkflow({ nodes, edges }))
    message.success('Workflow updated successfully')
  }

  const handleReset = () => {
    setNodes(workflow.nodes)
    setEdges(workflow.edges)
    message.info('Workflow reset to default')
  }

  const nodeTypes = {
    default: ({ data }) => (
      <div
        style={{
          padding: '10px 20px',
          background: '#fff',
          border: '2px solid #1890ff',
          borderRadius: 8,
          textAlign: 'center',
          minWidth: 150,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{data.label}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>{data.role}</div>
      </div>
    ),
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Workflow Diagram</h1>
          <p className="page-description">Project approval workflow visualization</p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {isAdmin && (
              <Space>
                <Switch
                  checked={editable}
                  onChange={(checked) => dispatch(setEditable(checked))}
                  checkedChildren="Editable"
                  unCheckedChildren="View Only"
                />
                {editable && (
                  <>
                    <Button type="primary" onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button onClick={handleReset}>Reset</Button>
                  </>
                )}
              </Space>
            )}

            <div style={{ height: '600px', border: '1px solid #f0f0f0', borderRadius: 4 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={editable}
                nodesConnectable={editable}
                elementsSelectable={editable}
              >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </div>

            <Card size="small">
              <div>
                <strong>Approval Flow:</strong> Employee → HOD → HR → Head HR → Admin
              </div>
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                {isAdmin
                  ? 'You can edit the workflow. Toggle "Editable" to make changes.'
                  : 'This is a read-only view of the approval workflow.'}
              </div>
            </Card>
          </Space>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default WorkflowDiagram
