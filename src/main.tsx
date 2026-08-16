import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Search, UserRound, Library, ChevronRight, X } from 'lucide-react';
import './styles.css';

type Book = { id:number; title:string; author:string; category:string; color:string; available:number; total:number; };

const books: Book[] = [
 {id:1,title:'The Great Gatsby',author:'F. Scott Fitzgerald',category:'Fiction',color:'#7f1d1d',available:3,total:5},
 {id:2,title:'Atomic Habits',author:'James Clear',category:'Self-Development',color:'#334155',available:4,total:6},
 {id:3,title:'The Hobbit',author:'J.R.R. Tolkien',category:'Fantasy',color:'#365314',available:2,total:4},
 {id:4,title:'Pride and Prejudice',author:'Jane Austen',category:'Romance',color:'#9f1239',available:1,total:3},
 {id:5,title:'Educated',author:'Tara Westover',category:'Biography',color:'#854d0e',available:5,total:5},
 {id:6,title:'The Alchemist',author:'Paulo Coelho',category:'Fiction',color:'#075985',available:2,total:4},
 {id:7,title:'Clean Code',author:'Robert C. Martin',category:'Technology',color:'#4338ca',available:3,total:3},
 {id:8,title:'Sapiens',author:'Yuval Noah Harari',category:'History',color:'#57534e',available:0,total:3},
 {id:9,title:'Ikigai',author:'Héctor García',category:'Self-Development',color:'#0f766e',available:4,total:4},
 {id:10,title:'Little Women',author:'Louisa May Alcott',category:'Romance',color:'#be185d',available:2,total:3},
];

function BookCard({book,onClick}:{book:Book;onClick:()=>void}){
 return <button className="book-card" onClick={onClick} aria-label={`View ${book.title}`}>
   <div className="book-cover" style={{background:book.color}}><span className="cover-mark">LIBRARY</span><strong>{book.title}</strong><small>{book.author}</small></div>
   <div className="book-spine" style={{background:book.color}}><span>{book.title}</span></div>
 </button>
}

function Shelf({title, items, onSelect}:{title:string;items:Book[];onSelect:(b:Book)=>void}){
 return <section className="shelf-section"><div className="section-heading"><div><p className="eyebrow">COLLECTION</p><h2>{title}</h2></div><button className="see-all">See all <ChevronRight size={16}/></button></div><div className="shelf"><div className="books-row">{items.map(book=><BookCard key={book.id} book={book} onClick={()=>onSelect(book)}/>)}</div><div className="shelf-board"/></div></section>
}

function App(){
 const [query,setQuery]=useState(''); const [category,setCategory]=useState('All'); const [selected,setSelected]=useState<Book|null>(null);
 const categories=['All',...Array.from(new Set(books.map(b=>b.category)))];
 const filtered=useMemo(()=>books.filter(b=>(category==='All'||b.category===category)&&(b.title+' '+b.author).toLowerCase().includes(query.toLowerCase())),[query,category]);
 const featured=filtered.slice(0,6); const newArrivals=filtered.slice(6,10);
 return <div className="app">
  <header className="navbar"><div className="brand"><div className="brand-icon"><Library size={22}/></div><div><strong>E-Library</strong><span>Digital Reading Room</span></div></div><nav><a className="active">Home</a><a>Browse</a><a>My Books</a><a>Borrowing</a></nav><button className="profile"><UserRound size={18}/><span>Account</span></button></header>
  <main>
   <section className="hero"><div><p className="eyebrow">WELCOME TO YOUR DIGITAL LIBRARY</p><h1>Find a book.<br/><em>Find a new world.</em></h1><p className="hero-copy">Explore our collection, discover something new, and keep your next great read close at hand.</p><div className="search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by title or author..."/><kbd>⌘ K</kbd></div></div><div className="hero-books"><div className="floating-book b1">READ<br/>MORE</div><div className="floating-book b2">YOUR<br/>STORY</div><div className="floating-book b3">OPEN<br/>MINDS</div></div></section>
   <div className="filters">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
   {filtered.length ? <><Shelf title="Featured Collection" items={featured} onSelect={setSelected}/>{newArrivals.length>0&&<Shelf title="More to Explore" items={newArrivals} onSelect={setSelected}/>}</> : <div className="empty"><BookOpen size={34}/><h3>No books found</h3><p>Try a different title, author, or category.</p></div>}
  </main>
  <footer>© 2026 E-Library · Your digital reading room</footer>
  {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button><div className="modal-cover" style={{background:selected.color}}>{selected.title}</div><div className="modal-info"><p className="eyebrow">{selected.category}</p><h2>{selected.title}</h2><p className="author">by {selected.author}</p><p className="availability">{selected.available} of {selected.total} copies available</p><button className="borrow" disabled={!selected.available}>Borrow Book</button></div></div></div>}
 </div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
