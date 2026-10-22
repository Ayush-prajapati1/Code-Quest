import Modal from '../common/Modal.jsx'

export default function LevelUpModal({ notification, onClose }) {
  return (
    <Modal
      actions={(
        <button className="btn btn-primary" onClick={onClose} type="button">
          CONTINUE THE QUEST
        </button>
      )}
      description="Your developer power has increased. New challenges await."
      onClose={onClose}
      open={Boolean(notification)}
      title={`LEVEL ${notification?.level ?? ''} REACHED`}
      variant="level-up"
    >
      <div className="level-up-burst" aria-hidden="true">▲</div>
      <dl className="level-up-details">
        <div><dt>New rank</dt><dd>{notification?.rank}</dd></div>
        <div><dt>Total XP</dt><dd>{notification?.totalXP}</dd></div>
      </dl>
    </Modal>
  )
}
