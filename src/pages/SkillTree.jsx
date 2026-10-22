import { Link } from 'react-router-dom'
import ProgressBar from '../components/common/ProgressBar.jsx'
import { useGame } from '../context/GameContext.jsx'
import { missions } from '../data/missions.js'
import { technologies } from '../data/technologies.js'
import { getTechnologyCompletion, isTechnologyUnlocked } from '../utils/gameProgress.js'

const branches = [
  {
    id: 'foundations',
    name: 'Computer Science Core',
    description: 'Build the systems knowledge beneath every reliable application.',
    nodes: [
      { id: 'cpp', label: 'Programming' },
      { id: 'dsa', label: 'DSA' },
      { id: 'dbms', label: 'DBMS' },
      { id: 'os', label: 'Operating Systems' },
      { id: 'cn', label: 'Computer Networks' },
    ],
  },
  {
    id: 'web',
    name: 'Frontend Engineering',
    description: 'Move from browser foundations to reactive interfaces.',
    nodes: [
      { id: 'html', label: 'HTML / CSS', future: true, available: true },
      { id: 'javascript', label: 'JavaScript' },
      { id: 'react', label: 'React' },
    ],
  },
  {
    id: 'backend',
    name: 'Backend Systems',
    description: 'Follow JavaScript into servers and future data services.',
    nodes: [
      { id: 'javascript', label: 'JavaScript' },
      { id: 'node', label: 'Node.js' },
      { id: 'express', label: 'Express', future: true },
      { id: 'mongodb', label: 'MongoDB', future: true },
    ],
  },
]

export default function SkillTree() {
  const { player } = useGame()

  const getNodeState = (node) => {
    if (node.future) {
      return { completion: node.available ? 100 : 0, state: node.available ? 'available' : 'future' }
    }

    const technology = technologies.find((item) => item.id === node.id)
    const completion = getTechnologyCompletion(player, missions, node.id)
    const unlocked = technology
      ? isTechnologyUnlocked(player, technologies, missions, technology)
      : false

    return {
      completion: completion.percentage,
      state: completion.bossDefeated ? 'completed' : unlocked ? 'available' : 'locked',
    }
  }

  return (
    <section className="page-container skill-tree-page" aria-labelledby="skill-tree-title">
      <header className="page-hero">
        <p className="page-eyebrow">ABILITY MATRIX</p>
        <h1 className="page-title" id="skill-tree-title">SKILL TREE</h1>
        <p className="page-description">Trace connected learning paths. Complete missions and defeat world bosses to transform available nodes into mastered skills.</p>
      </header>

      <div className="skill-legend" aria-label="Skill state legend">
        <span><i className="legend-dot completed" /> Completed</span>
        <span><i className="legend-dot available" /> Available</span>
        <span><i className="legend-dot locked" /> Locked</span>
        <span><i className="legend-dot future" /> Future expansion</span>
      </div>

      <div className="skill-branches">
        {branches.map((branch) => (
          <section className="game-card skill-branch" aria-labelledby={`${branch.id}-title`} key={branch.id}>
            <header><p className="page-eyebrow">SKILL BRANCH</p><h2 id={`${branch.id}-title`}>{branch.name}</h2><p>{branch.description}</p></header>
            <div className="skill-path">
              {branch.nodes.map((node, index) => {
                const { completion, state } = getNodeState(node)
                return (
                  <div className="skill-step" key={`${branch.id}-${node.id}`}>
                    {index > 0 && <span className="skill-connector" aria-hidden="true">→</span>}
                    <article className={`skill-node is-${state}`}>
                      <div className="skill-node-symbol" aria-hidden="true">
                        {state === 'completed' ? '✓' : state === 'locked' ? '⌁' : state === 'future' ? '…' : '</>'}
                      </div>
                      <h3>{node.label}</h3>
                      <span className="skill-state">{state}</span>
                      <ProgressBar compact label={`${node.label} mastery`} value={completion} variant={state === 'completed' ? 'success' : 'xp'} />
                      {!node.future && state !== 'locked' && <Link to={`/technology/${node.id}`}>Open world</Link>}
                      {node.future && <small>Roadmap node</small>}
                    </article>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
