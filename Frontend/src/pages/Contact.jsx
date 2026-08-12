function Contact() {
  return (
    <div className="page-container">

      <h2 className="page-title">☎ Contact & Help</h2>

      <div className="contact-grid">

        <div className="contact-card">
          <h3>Support</h3>
          <p className="contact-info">
            Helpline: +91 9448008111<br />
            Email: support@smartspend.com
          </p>
        </div>

        <div className="contact-card">
          <h3>About SmartSpend</h3>

          <div className="about-box">
            <p>
              SmartSpend helps users analyze their spending habits
              and improve financial planning using intelligent insights.
            </p>
          </div>

          <div className="review-list">
            <div className="review">⭐️⭐️⭐️⭐️⭐️ Great budgeting app!</div>
            <div className="review">⭐️⭐️⭐️⭐️ Clean UI and useful analytics</div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Contact