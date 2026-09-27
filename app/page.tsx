'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HeartHandshake,
  MapPin,
  Menu,
  MessageCircle,
  Play,
  Users,
  X,
} from 'lucide-react'

const logo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pax%20logo.png-dw6BCp3diDo34jMOdKbpKIZnjNDXzI.jpeg'
const slides = [
  {
    image:
      'https://images.unsplash.com/photo-1548625361-58a7d65e0b7f?auto=format&fit=crop&w=1800&q=85',
    eyebrow: 'One family. One mission.',
    title: 'Liberation for peace.',
    body: 'Welcome to the home of young Catholic professionals growing in faith, friendship, and service.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1800&q=85',
    eyebrow: 'Faith in action',
    title: 'We are better together.',
    body: 'Build lasting friendships and serve the church with purpose through IMCS-PAX Romana.',
  },
]
const events = [
  {
    month: 'SEP',
    day: '14',
    type: 'Conference',
    title: 'National Pax Conference 2026',
    detail: 'A weekend of formation, fellowship, and a renewed commitment to peace.',
    place: 'UMaT Campus, Tarkwa',
    time: 'Fri, Sep 14 · 4:00 PM',
    tone: 'blue',
  },
  {
    month: 'OCT',
    day: '03',
    type: 'Fellowship',
    title: 'Pax-Sice: The Table',
    detail: 'An evening of food, honest conversation, and community for every member.',
    place: 'UMaT Catholic Chaplaincy',
    time: 'Sat, Oct 03 · 5:30 PM',
    tone: 'yellow',
  },
  {
    month: 'OCT',
    day: '18',
    type: 'Formation',
    title: 'UMaT Community Mass',
    detail: 'Our monthly service and reflection for the IMCS-PAX Romana community.',
    place: 'UMaT Catholic Chaplaincy',
    time: 'Sun, Oct 18 · 10:00 AM',
    tone: 'blue',
  },
]
const executives = [
  ['Divine Mwinbegureh Bonu-Ire', 'President', '/Executives/Bonu-Ire Divine Mwinbegureh President.jpg'],
  ['Kitsi Desmond Dan-Jerry', 'Vice President', '/Executives/Kissi Desmond Dan-Jerry.jpg'],
  ['Santa Marrius Mwinekuma Tambaah', 'Catechist', '/Executives/Santa Marrius.jpeg'],
  ['Batoe Richmond', 'Assistant Catechist', '/Executives/Batoe Richmond Outreach Coordinator.jpg'],
  ['Irene Yankey', 'General Secretary', '/Executives/Irene Yankey General Secretary.jpg'],
  ['Gifty Wilson', 'Assistant General Secretary', '/Executives/Wilson Gifty.jpg'],
  ['Emelia Prah', 'Wocom', '/Executives/Emelia Prah.png'],
  ['Monique Male Malenuba', 'Assistant Wocom', '/Executives/Monique Marla.jpeg'],
  ['Mawinbe Thomas Mbamondor', 'Organising Secretary', '/Executives/Mawinbe Thomas Organising Secretary.jpg'],
  ['Segkpeb Dorcas', 'Assistant Organising Secretary', '/Executives/Dorcas.jpg'],
  ['Marcia Aku Mensah', 'Financial Secretary', '/Executives/Marcia.jpeg'],
  ['Agbesi Emmaculate Klenam Esi', 'Treasurer', '/Executives/Mavis.jpeg'],
  ['Kalayi-Tetteh Benjamin', 'Prayer Secretary', '/Executives/Kalayi Benjamin Tetteh Prayer Secretary.jpg'],
  ['Apotiga Mcloyd Winesongeya', 'Publicity Officer', '/Executives/Apotiga Mcloyd Winesongeya Publicity Head.jpg'],
  ['Nana Akosua Panyin Ebbin', 'Assistant Publicity Officer', '/Executives/Ebbin Nana Akosua Deputy Publicity Head.jpg'],
  ['Atta Augustine Tuffour', 'Outreach Coordinator', '/Executives/Augustine Atta Tuffour.jpeg'],
  ['Zerubabel Tanoe', 'Assistant Outreach Coordinator', '/Executives/Zerubabel.jpeg'],
  ['Domayele Brian-Louis Song-Noma', 'Music Director', '/Executives/Brian-Louis.jpeg'],
  ['Perpetual Kwegyir-Abaidoo', 'Choir President', '/Executives/Perpetual.jpeg'],
  ['Kpieonoma Irene Mwinengkoma', 'Heavenly Jewels President', '/Executives/Irene k.jpg'],
  ['Boye-Doe Godsway', 'Lectors Head', '/Executives/Boye-Doe.jpeg'],
  ['Osei Joshua Kwadwo Gyau', 'Mass Servers President', '/Executives/Joshua Osie.jpg'],
  ['Joseph Kwame Ketedzi', 'CCR Coordinator', '/Executives/Ketedzi Joseph Kwame ITI-CCR Coordinator.jpg'],
  ['Frank Sombawira', 'Technical Head', '/Executives/lawrencia.jpg'],
  ['Buamah Mavis Eyram', 'Arts and Drama President', '/Executives/Mavis.jpeg'],
  ['Nana Ama Ampong', 'Ushering Head', '/Executives/Abobo Maximillian Kolbe SCC Rep.jpg'],
  ['Samuel Obrempong Afriyie', 'Legion of Mary President', '/Executives/Obrempong.jpeg'],
].map(([name, role, image]) => ({
  name,
  role,
  year: '2026 – 2027',
  program: 'UMaT Local',
  image,
}))

function Heading({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string
  title: string
  body?: string
  action?: string
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {body && <p className="section-body">{body}</p>}
      </div>
      {action && (
        <a className="text-link" href="#events">
          {action} <ArrowRight size={16} />
        </a>
      )}
    </div>
  )
}
export default function Page() {
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((value) => (value + 1) % slides.length)
    }, 7000)

    return () => clearInterval(timer)
  }, [])

  const slide = slides[active]
  return (
    <main>
      <div className="announcement">
        <span>Next service: Sunday, 7:00 AM at St. John the Evangelist Church, Brahabebome</span>
        <a href="#activities">
          View activities <ArrowRight size={14} />
        </a>
      </div>

      <header className="site-header">
        <a className="brand" href="#top">
          <img src={logo} alt="IMCS-PAX Romana logo" />
          <span>
            <strong>IMCS</strong>
            <small>PAX ROMANA UMaT Local</small>
          </span>
        </a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#about">About us</a>
          <a href="#events">Events</a>
          <a href="#executives">Executives</a>
          <a href="#alumni">Alumni</a>
          <a href="#give">Give</a>
          <a href="/register">Join Us</a>
          <a className="nav-login" href="/login">
            Member login <ArrowRight size={15} />
          </a>
        </nav>
        <button
          className="menu-button"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section
        id="top"
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(6,22,61,.92), rgba(6,22,61,.12)), url(${slide.image})`,
        }}
      >
        <div className="hero-content">
          <p className="eyebrow light">{slide.eyebrow}</p>
          <h1>{slide.title}</h1>
          <p>{slide.body}</p>
          <div className="hero-actions">
            <a href="#join" className="button button-yellow">
              Join the family <ArrowRight size={17} />
            </a>
            <a href="#about" className="button button-ghost">
              <Play size={15} fill="currentColor" /> Our story
            </a>
          </div>
        </div>
        <div className="hero-controls">
          <button
            aria-label="Previous slide"
            onClick={() => setActive((active - 1 + slides.length) % slides.length)}
          >
            <ChevronLeft />
          </button>
          <div className="slide-count">
            <strong>0{active + 1}</strong>
            <span>/ 0{slides.length}</span>
          </div>
          <button
            aria-label="Next slide"
            onClick={() => setActive((active + 1) % slides.length)}
          >
            <ChevronRight />
          </button>
        </div>
        <div className="hero-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              aria-label={`Show slide ${index + 1}`}
              className={index === active ? 'active' : ''}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      </section>

      <section className="welcome section" id="about">
        <div className="welcome-image">
          <img src="/gathering.jpeg" alt="Friends gathering together outdoors" />
          <div className="image-note">
            <HeartHandshake size={22} />
            <span>
              <strong>Since 1948</strong>
              <small>Faith, friendship & service</small>
            </span>
          </div>
        </div>
        <div className="welcome-copy">
          <p className="eyebrow">Welcome home</p>
          <h2>A movement for students, professionals, and peace.</h2>
          <p>
            IMCS-PAX Romana UMaT Local is a student community of Catholic students and professionals at the University of Mines and Technology. We gather to deepen our faith, form meaningful relationships, and bring the Gospel into the world around us.
          </p>
          <div className="value-row">
            <div>
              <span className="value-icon"><Users size={19} /></span>
              <strong>Find your people</strong>
              <p>A community that sees you and makes room for your story.</p>
            </div>
            <div>
              <span className="value-icon blue"><HeartHandshake size={19} /></span>
              <strong>Live your values</strong>
              <p>Turn faith into action through service and solidarity.</p>
            </div>
          </div>
          <a className="text-link" href="#join">
            Discover our story <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="events section" id="events">
        <Heading
          eyebrow="Mark your calendar"
          title="Upcoming moments"
          body="There is always a place at the table. Find your next moment of connection."
          action="See all events"
        />
        <div className="event-grid">
          {events.map((event) => (
            <article className="event-card" key={event.title}>
              <div className={`date-tile ${event.tone}`}>
                <span>{event.month}</span>
                <strong>{event.day}</strong>
              </div>
              <div className="event-info">
                <span className="event-type">{event.type}</span>
                <h3>{event.title}</h3>
                <p>{event.detail}</p>
                <div className="event-meta">
                  <span><MapPin size={14} />{event.place}</span>
                  <span><Clock3 size={14} />{event.time}</span>
                </div>
              </div>
              <button className="circle-arrow" aria-label={`Register for ${event.title}`}>
                <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="activity-band" id="activities">
        <div>
          <p className="eyebrow light">Every Sunday</p>
          <h2>Rooted in worship.<br /><em>Ready for the world.</em></h2>
        </div>
        <div className="service-card">
          <div className="service-icon"><CalendarDays /></div>
          <div>
            <span>Church activity</span>
            <h3>Sunday Community Mass</h3>
            <p>UMaT Catholic Chaplaincy · Every Sunday at 10:00 AM</p>
          </div>
          <ArrowRight size={19} />
        </div>
      </section>

      <section className="executives section" id="executives">
        <Heading
          eyebrow="Meet the team"
          title="Our executives"
          body="The people serving our movement in this season."
          action="View directory"
        />
        <div className="executive-grid">
          {executives.map((person) => (
            <article className="executive-card" key={person.name}>
              <img src={person.image} alt={person.name} />
              <div className="executive-detail">
                <span>{person.role}</span>
                <h3>{person.name}</h3>
                <p>{person.program} · {person.year}</p>
                <span className="executive-contact">
                  <MessageCircle size={15} /> Contact via chapter office
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="alumni section" id="alumni">
        <div className="alumni-copy">
          <p className="eyebrow">Once Pax, always Pax</p>
          <h2>The journey continues with our alumni.</h2>
          <p>Four years after graduation, members find a new home in our alumni community — a place to keep serving, connecting, and giving back.</p>
          <a href="#join" className="button button-navy">
            Explore alumni <ArrowRight size={17} />
          </a>
        </div>
        <div className="alumni-stat">
          <strong>04</strong>
          <span>years to a<br />lifelong community</span>
        </div>
      </section>

      <section className="give section" id="give">
        <div>
          <p className="eyebrow">Make an impact</p>
          <h2>Your generosity keeps the movement moving.</h2>
          <p>Every contribution supports formation, community, and the work of building a more peaceful world.</p>
        </div>
        <a className="button button-yellow" href="/donate">
          Give today <ArrowRight size={17} />
        </a>
      </section>

      <section className="join section" id="join">
        <div className="join-card">
          <div>
            <p className="eyebrow light">Your next chapter</p>
            <h2>There is a place for you here.</h2>
            <p>Register as a member to get event updates, complete your onboarding, and meet your community.</p>
          </div>
          <a className="button button-yellow" href="/register">
            Become a member <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <a className="brand" href="#top">
            <img src={logo} alt="IMCS-PAX Romana logo" />
            <span>
              <strong>IMCS</strong>
              <small>PAX ROMANA</small>
            </span>
          </a>
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#events">Events</a>
            <a href="#executives">Leadership</a>
            <a href="#give">Donate</a>
          </div>
          <p>For faith. For friendship. For peace.</p>
        </div>
        <div className="footer-bottom">
          <span>© 2026 IMCS-PAX Romana UMaT Local. All rights reserved.</span>
          <span>Built with faith and purpose.</span>
        </div>
      </footer>
    </main>
  )
}
