import fs from 'fs';
import path from 'path';

let targetFile = path.resolve('src/App.tsx');
let code = fs.readFileSync(targetFile, 'utf8');
const lines = code.split('\n');

const replacement = `                             <div className="space-y-3">
                                {jenis.dokumen && jenis.dokumen.length > 0 ? (
                                  jenis.dokumen.map((docName: string, docIdx: number) => {
                                    const fileKey = \`\${i}-\${docIdx}\`;
                                    const file = uploadedFiles[fileKey];

                                    return (
                                      <div 
                                        key={docIdx} 
                                        className={cn(
                                          "border rounded-3xl p-5 sm:p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4",
                                          file 
                                            ? "bg-emerald-500/[0.02] border-emerald-500/20 hover:border-emerald-500/30" 
                                            : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100"
                                        )}
                                      >
                                         <div className="flex items-start gap-4">
                                            <div className={cn(
                                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors",
                                              file ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-50 text-slate-400"
                                            )}>
                                               {file ? <Check className="w-5 h-5 stroke-[3]" /> : <Paperclip className="w-5 h-5" />}
                                            </div>
                                            <div className="space-y-1 bg-transparent p-0 rounded-none">
                                               <h6 className="font-bold text-slate-800 text-sm leading-snug">{docName}</h6>
                                               <p className="text-xs text-slate-400 font-medium">Format: PDF/Gambar hasil scan asli (Maks. 5MB)</p>
                                            </div>
                                         </div>

                                         <div className="flex items-center gap-3 self-end md:self-auto shrink-0 relative z-10">
                                            {file ? (
                                               <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-xl border border-slate-100 shadow-sm animate-in zoom-in-95 duration-150">
                                                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                     <Check className="w-3 h-3 stroke-[3]" /> Terunggah
                                                  </div>
                                                  <div className="max-w-[120px] sm:max-w-[180px] truncate text-xs text-slate-600 font-bold pl-1">
                                                     {file.name}
                                                  </div>
                                                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                                                     {file.size}
                                                  </span>

                                                  <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                                                  <button 
                                                    onClick={() => setPreviewingFile(file)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                                                    title="Pratinjau File"
                                                  >
                                                     <Eye className="w-4 h-4" />
                                                  </button>
                                                  <button 
                                                    onClick={() => handleRemoveFile(fileKey)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Hapus File"
                                                  >
                                                     <Trash className="w-4 h-4" />
                                                  </button>
                                               </div>
                                            ) : (
                                               <button 
                                                 onClick={() => document.getElementById(\`file-input-\${fileKey}\`)?.click()}
                                                 className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-2xl text-xs font-black text-slate-600 hover:text-blue-600 transition-all cursor-pointer shadow-sm group"
                                               >
                                                  <Upload className="w-3.5 h-3.5 transform group-hover:-translate-y-0.5 transition-transform" />
                                                  <span>UNGGAH BERKAS</span>
                                                  <input 
                                                    id={\`file-input-\${fileKey}\`}
                                                    type="file" 
                                                    accept=".pdf,image/*" 
                                                    className="hidden" 
                                                    onChange={(e) => handleFileUpload(e, fileKey)}
                                                  />
                                               </button>
                                            )}
                                         </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-sm text-slate-400 italic">Tidak ada kelengkapan khusus.</p>
                                )}
                             </div>`;

// 1451 to 1534 currently handles this text
lines.splice(1451, 1534 - 1451 + 1, replacement);

fs.writeFileSync(targetFile, lines.join('\n'));
console.log('Fixed block completely');
