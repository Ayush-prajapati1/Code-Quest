const missionBlueprints = {
  cpp: {
    missions: [
      ['Syntax Gateway', 'Restore the training console by decoding C++ syntax and types.', 'Syntax and Types'],
      ['Control Core', 'Repair the control core with precise branches and loops.', 'Control Flow'],
      ['Function Foundry', 'Forge reusable functions and master references and scope.', 'Functions and References'],
      ['Object Citadel', 'Rebuild the citadel using classes, inheritance, and polymorphism.', 'Object-Oriented Programming'],
      ['STL Arsenal', 'Equip the resistance with containers, iterators, and algorithms.', 'STL and Memory'],
    ],
    boss: ['Compiler King', 'Defeat the Compiler King by combining every C++ skill.', 'C++ Mastery'],
  },
  java: {
    missions: [
      ['JVM Awakening', 'Wake the dormant JVM with Java syntax, values, and operators.', 'Syntax and Types'],
      ['Method Matrix', 'Stabilize the matrix using methods, scope, and control flow.', 'Methods and Control Flow'],
      ['Class Forge', 'Design the guardians of the forge with encapsulated classes.', 'Classes and Encapsulation'],
      ['Inheritance Tower', 'Climb the tower with interfaces, inheritance, and polymorphism.', 'Inheritance and Interfaces'],
      ['Collection Vault', 'Recover the vault keys using collections, generics, and exceptions.', 'Collections and Exceptions'],
    ],
    boss: ['Bytecode Warden', 'Challenge the Bytecode Warden across the full Java platform.', 'Java Mastery'],
  },
  python: {
    missions: [
      ['Indentation Isles', 'Navigate the isles with clean Python syntax and data types.', 'Syntax and Types'],
      ['Loop Labyrinth', 'Escape the labyrinth with conditions, loops, and comprehensions.', 'Control Flow'],
      ['Function Workshop', 'Automate the workshop with functions, arguments, and scope.', 'Functions'],
      ['Collection Cavern', 'Map the cavern using lists, tuples, sets, and dictionaries.', 'Collections'],
      ['Pythonic Peak', 'Reach the peak with classes, exceptions, iterators, and context managers.', 'Advanced Python'],
    ],
    boss: ['Indentation Dragon', 'Outwit the Indentation Dragon with Pythonic solutions.', 'Python Mastery'],
  },
  javascript: {
    missions: [
      ['Variable District', 'Restore power with modern variables, values, and operators.', 'Syntax and Types'],
      ['Function Circuit', 'Reconnect the circuit using functions, scope, and closures.', 'Functions and Scope'],
      ['Object Network', 'Decode the network of arrays, objects, and transformations.', 'Objects and Arrays'],
      ['DOM Uprising', 'Regain the interface by handling elements and browser events.', 'DOM and Events'],
      ['Promise Portal', 'Open the portal with promises, async functions, and error handling.', 'Asynchronous JavaScript'],
    ],
    boss: ['Async Phantom', 'Synchronize the realm and banish the Async Phantom.', 'JavaScript Mastery'],
  },
  react: {
    missions: [
      ['Component Camp', 'Assemble reusable components to establish a new base.', 'Components and JSX'],
      ['Props Relay', 'Deliver data safely through the component relay.', 'Props and Composition'],
      ['State Reactor', 'Control the reactor with state and event-driven updates.', 'State and Events'],
      ['Effect Observatory', 'Synchronize with external systems from the observatory.', 'Effects and Lifecycle'],
      ['Hook Nexus', 'Unify shared behavior with hooks, context, and reducer patterns.', 'Hooks and State Architecture'],
    ],
    boss: ['Hook Overlord', 'Render a flawless strategy against the Hook Overlord.', 'React Mastery'],
  },
  node: {
    missions: [
      ['Runtime Station', 'Bring the server runtime online with modules and package basics.', 'Runtime and Modules'],
      ['Event Engine', 'Tune the event engine using callbacks, emitters, and asynchronous flow.', 'Events and Async'],
      ['HTTP Outpost', 'Secure the outpost by building robust HTTP request handlers.', 'HTTP and APIs'],
      ['Stream Pipeline', 'Move critical data through buffers, streams, and backpressure.', 'Streams and Buffers'],
      ['Service Fortress', 'Harden the service with validation, errors, and process safety.', 'Production Node.js'],
    ],
    boss: ['Event Loop Leviathan', 'Keep the runtime responsive while battling the Event Loop Leviathan.', 'Node.js Mastery'],
  },
  sql: {
    missions: [
      ['Query Terminal', 'Retrieve the first intelligence records with SELECT and filtering.', 'SELECT and Filtering'],
      ['Join Junction', 'Reconnect divided datasets with accurate relational joins.', 'Joins'],
      ['Aggregate Arena', 'Summarize battle data with grouping and aggregate functions.', 'Aggregation'],
      ['Subquery Depths', 'Recover hidden records using subqueries, CTEs, and set operations.', 'Subqueries and CTEs'],
      ['Transaction Chamber', 'Protect the archive using transactions, constraints, and indexes.', 'Transactions and Design'],
    ],
    boss: ['Query Master', 'Optimize the final query and defeat the Query Master.', 'SQL Mastery'],
  },
  dbms: {
    missions: [
      ['Schema Sector', 'Model the sector with entities, relationships, and dependable keys.', 'Data Modeling'],
      ['Normalization Lab', 'Remove anomalies by normalizing the research database.', 'Normalization'],
      ['Index Engine', 'Accelerate the engine with appropriate index structures.', 'Indexes and Storage'],
      ['Transaction Grid', 'Preserve consistency across concurrent transactions.', 'Transactions and Concurrency'],
      ['Recovery Archive', 'Protect the archive with logging, recovery, and distributed concepts.', 'Recovery and Architecture'],
    ],
    boss: ['Transaction Tyrant', 'Maintain ACID guarantees against the Transaction Tyrant.', 'DBMS Mastery'],
  },
  dsa: {
    missions: [
      ['Complexity Gate', 'Choose efficient paths by reading time and space complexity.', 'Complexity and Arrays'],
      ['Linked Ruins', 'Reconnect the ruins with linked structures, stacks, and queues.', 'Linear Data Structures'],
      ['Tree Sanctuary', 'Traverse the sanctuary using trees, heaps, and recursion.', 'Trees and Heaps'],
      ['Graph Frontier', 'Map the frontier with graph traversal and shortest paths.', 'Graphs'],
      ['Pattern Crucible', 'Solve the crucible with greedy, backtracking, and dynamic programming.', 'Algorithmic Patterns'],
    ],
    boss: ['Algorithm Titan', 'Find the optimal strategy to topple the Algorithm Titan.', 'DSA Mastery'],
  },
  os: {
    missions: [
      ['Process Bay', 'Coordinate programs, processes, threads, and system calls.', 'Processes and Threads'],
      ['Scheduler Deck', 'Balance the deck with fair and responsive CPU scheduling.', 'CPU Scheduling'],
      ['Memory Vault', 'Manage address spaces with paging, segmentation, and virtual memory.', 'Memory Management'],
      ['Concurrency Reactor', 'Prevent races while synchronizing the reactor crew.', 'Synchronization'],
      ['Kernel Archives', 'Secure files, I/O, protection, and recovery mechanisms.', 'File Systems and Deadlocks'],
    ],
    boss: ['Deadlock Destroyer', 'Break every circular wait before the Deadlock Destroyer strikes.', 'Operating Systems Mastery'],
  },
  cn: {
    missions: [
      ['Protocol Port', 'Identify the layers and protocols moving data through the port.', 'Network Models'],
      ['Addressing Sector', 'Route the fleet with IPv4, IPv6, subnetting, and ARP.', 'Addressing and Subnetting'],
      ['Routing Nexus', 'Choose reliable paths through switches, routers, and routing tables.', 'Switching and Routing'],
      ['Transport Channel', 'Tune delivery with TCP, UDP, flow control, and congestion control.', 'Transport Layer'],
      ['Web Signal', 'Secure application traffic with DNS, HTTP, TLS, and diagnostics.', 'Application and Security'],
    ],
    boss: ['Packet Overlord', 'Deliver every packet and defeat the Packet Overlord.', 'Networking Mastery'],
  },
}

const missionDifficulties = ['Easy', 'Easy', 'Medium', 'Medium', 'Hard']

function createTechnologyMissions(technologyId, blueprint) {
  const standardMissions = blueprint.missions.map(([name, story, topic], index) => ({
    id: `${technologyId}-${index + 1}`,
    technologyId,
    order: index + 1,
    name,
    story,
    topic,
    difficulty: missionDifficulties[index],
    requiredQuestions: index < 2 ? 5 : 7,
    rewardXP: 70 + index * 25,
    rewardCoins: 15 + index * 5,
    boss: false,
  }))

  const [bossName, bossStory, bossTopic] = blueprint.boss

  return [
    ...standardMissions,
    {
      id: `${technologyId}-boss`,
      technologyId,
      order: standardMissions.length + 1,
      name: bossName,
      bossName,
      story: bossStory,
      topic: bossTopic,
      difficulty: 'Boss',
      requiredQuestions: 8,
      rewardXP: 300,
      rewardCoins: 100,
      boss: true,
      bossHealth: 100,
      damagePerCorrectAnswer: 20,
    },
  ]
}

export const missions = Object.entries(missionBlueprints).flatMap(
  ([technologyId, blueprint]) => createTechnologyMissions(technologyId, blueprint),
)

export function getMissionsByTechnology(technologyId) {
  return missions.filter((mission) => mission.technologyId === technologyId)
}

export function getMissionById(technologyId, missionId) {
  return (
    missions.find(
      (mission) => mission.technologyId === technologyId && mission.id === missionId,
    ) ?? null
  )
}

export function getBossMission(technologyId) {
  return (
    missions.find((mission) => mission.technologyId === technologyId && mission.boss) ??
    null
  )
}
