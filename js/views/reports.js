/**
 * ============================================================================
 * Proyecto: PreuSync Admin Panel
 * Archivo: reports.js
 * Versión: v3.0.0
 * Descripción: Centro de Moderación Doble: Denuncias reales de Publicaciones en DB2
 *              Community y Reportes de Errores/Bugs de la App en DB1 Edu.
 * Autor: JiroxDEV
 * Licensed under the GNU Affero General Public License v3
 * ============================================================================
 */

import { ApiClient } from '../api.js';

export async function renderReportsManager(container) {
  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Moderación y Reportes de Errores</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Audita denuncias reales de publicaciones en DB2 Community y reportes de errores técnicos en DB1 Edu</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Moderación de Contenido Comunitario -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <i data-lucide="flag" class="w-5 h-5 text-amber-500"></i>
              Denuncias de Publicaciones (DB2)
            </h2>
            <button id="btnRefreshPostReports" class="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline">
              Refrescar
            </button>
          </div>
          <div id="postReportsContainer" class="space-y-3">
            <div class="p-4 text-center text-slate-400 text-sm">Consultando denuncias...</div>
          </div>
        </div>

        <!-- Reportes de Bugs en DB1 Edu -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <i data-lucide="bug" class="w-5 h-5 text-rose-500"></i>
              Informes de Errores de App (DB1)
            </h2>
            <button id="btnRefreshBugReports" class="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline">
              Refrescar
            </button>
          </div>
          <div id="bugReportsContainer" class="space-y-3">
            <div class="p-4 text-center text-slate-400 text-sm">Consultando reportes de bugs...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  document.getElementById('btnRefreshPostReports').addEventListener('click', loadPostReports);
  document.getElementById('btnRefreshBugReports').addEventListener('click', loadBugReports);

  loadPostReports();
  loadBugReports();
}

async function loadPostReports() {
  const container = document.getElementById('postReportsContainer');
  try {
    const res = await ApiClient.getPostReports();
    const postDenuncias = res.data || [];

    if (postDenuncias.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">No hay denuncias de publicaciones comunitarias registradas.</div>';
    } else {
      container.innerHTML = postDenuncias.map(r => `
        <div class="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm">Post: "${r.post_title}"</h4>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              Denunciado
            </span>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300 font-medium">Motivo: "${r.reason}"</p>
          <div class="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-amber-800/40">
            <span class="text-[11px] text-slate-500">Denunciado por: @${r.reporter_username}</span>
            <div class="flex items-center gap-2">
              <button data-delete-target-post="${r.post_id}" data-report-id="${r.id}" class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all">
                Eliminar Post Denunciado
              </button>
              <button data-delete-post-report="${r.id}" class="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition-all">
                Descartar
              </button>
            </div>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('[data-delete-target-post]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const postId = e.currentTarget.dataset.deleteTargetPost;
          const reportId = e.currentTarget.dataset.reportId;
          if (confirm('¿Desea eliminar definitivamente la publicación denunciada?')) {
            try {
              await ApiClient.deletePost(postId);
              if (reportId) await ApiClient.deletePostReport(reportId);
              alert('Publicación denunciada eliminada exitosamente');
              loadPostReports();
            } catch (err) {
              alert('Error al eliminar post: ' + err.message);
            }
          }
        });
      });

      container.querySelectorAll('[data-delete-post-report]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const reportId = e.currentTarget.dataset.deletePostReport;
          try {
            await ApiClient.deletePostReport(reportId);
            loadPostReports();
          } catch (err) {
            alert('Error al descartar denuncia: ' + err.message);
          }
        });
      });
    }
  } catch (e) {
    container.innerHTML = '<div class="p-4 text-center text-rose-400 text-sm">Error al cargar denuncias de la comunidad.</div>';
  }
}

async function loadBugReports() {
  const container = document.getElementById('bugReportsContainer');
  try {
    const res = await ApiClient.getBugReports();
    const bugReports = res.data || [];

    if (bugReports.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">No hay reportes de bugs técnicos en DB1.</div>';
    } else {
      container.innerHTML = bugReports.map(r => `
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm">${r.user_description || 'Error de App'}</h4>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              ${r.device_info || 'Android'}
            </span>
          </div>
          <p class="text-xs text-rose-600 dark:text-rose-400 font-mono font-medium">${r.error_log || 'Sin log de error'}</p>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <span class="text-[11px] text-slate-400">Usuario ID: ${r.user_id ? r.user_id.substring(0, 8) + '...' : 'Anónimo'}</span>
            <button data-delete-report="${r.id}" class="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-all">
              Eliminar Reporte
            </button>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('[data-delete-report]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const reportId = e.currentTarget.dataset.deleteReport;
          try {
            await ApiClient.deleteReport(reportId);
            loadBugReports();
          } catch (err) {
            alert('Error al eliminar reporte: ' + err.message);
          }
        });
      });
    }
  } catch (e) {
    container.innerHTML = '<div class="p-4 text-center text-rose-400 text-sm">Error al cargar reportes de bugs.</div>';
  }
}
