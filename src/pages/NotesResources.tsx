import { FileText, Upload, Search, Download, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
const resources = [{name:'Java OOP Notes',type:'PDF',size:'2.4 MB',by:'Maria Santos',color:'orange'},{name:'Database ERD Diagram',type:'PDF',size:'1.8 MB',by:'John Rivera',color:'red'},{name:'Networking Review',type:'DOCX',size:'840 KB',by:'Angelica Cruz',color:'green'},{name:'Web Dev Cheat Sheet',type:'PDF',size:'1.2 MB',by:'Mark Dela Cruz',color:'orange'}]
export default function NotesResources() {
  const [query,setQuery]=useState('')
  return <><PageHeader title="Notes & Resources" subtitle="Access and share study materials with your group." action={<label className="btn-primary upload-btn"><Upload size={15}/> Upload<input type="file" hidden/></label>}/><div className="search-inline"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search notes or resources..."/></div><div className="filter-chips"><button className="selected">All Resources</button><button>My Uploads</button><button>Shared with Me</button></div><div className="resource-grid">{resources.filter(r=>r.name.toLowerCase().includes(query.toLowerCase())).map(r=><article className="resource-card" key={r.name}><div className={`file-icon ${r.color}`}><FileText/></div><button className="more-button"><MoreVertical size={16}/></button><h3>{r.name}</h3><p>{r.type} • {r.size}</p><small>Uploaded by {r.by}</small><button className="btn-soft"><Download size={14}/> Download</button></article>)}</div></>
}
