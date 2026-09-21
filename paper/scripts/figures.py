"""Deterministic vector diagrams from the website's exported pentagrid geometry."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Arc, Circle
from matplotlib.collections import PolyCollection

PAPER = Path(__file__).resolve().parents[1]
OUT = PAPER / 'figures'
DATA = json.loads((PAPER / 'build/geometry.json').read_text())
V = np.array(DATA['vectors'])
G = np.array(DATA['shifts'])
NAVY, BLUE, CORAL = '#003e72', '#97cbe7', '#e98576'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 12, 'text.color': NAVY,
                     'mathtext.fontset': 'cm', 'svg.fonttype': 'none', 'pdf.fonttype': 42,
                     'axes.linewidth': .7})

def save(fig, name):
    OUT.mkdir(exist_ok=True)
    for ext in ['pdf', 'svg']:
        fig.savefig(OUT / f'{name}.{ext}', bbox_inches='tight', pad_inches=.08, facecolor='white')
    plt.close(fig)

def clean(ax, limits=None):
    ax.set_aspect('equal')
    ax.axis('off')
    if limits:
        ax.set_xlim(limits[:2]); ax.set_ylim(limits[2:])

def tiles(ax, collection, selected=None, bounds=None, muted=False):
    polygons = [t['points'] for t in collection]
    colors = [CORAL if t['type'] == 'thick' else BLUE for t in collection]
    ax.add_collection(PolyCollection(polygons, facecolors=colors, edgecolors='#34516a', linewidths=.4, alpha=.4 if muted else 1))
    if selected:
        ax.add_patch(Polygon(selected['points'], facecolor=CORAL if selected['type']=='thick' else BLUE,
                             edgecolor=NAVY, linewidth=2.5, zorder=5))
    if bounds is None:
        p = np.array(polygons).reshape(-1, 2); lo = p.min(axis=0)-.6; hi = p.max(axis=0)+.6
        bounds = [lo[0],hi[0],lo[1],hi[1]]
    clean(ax,bounds)

def grid(ax, shifts=G, extent=3.4, selected=None, center=(0,0), emphasis=True):
    center=np.asarray(center); reach=np.linalg.norm(center)+extent*2
    for j,v in enumerate(V):
        tangent=np.array([-v[1],v[0]])
        for k in range(int(np.floor(-reach+shifts[j])),int(np.ceil(reach+shifts[j]))+1):
            xy=(k-shifts[j])*v
            highlighted=selected and ((j==selected['r'] and k==selected['kr']) or (j==selected['s'] and k==selected['ks']))
            color=(NAVY if j==selected['r'] else CORAL) if highlighted else '#779cbd'
            a,b=xy-reach*tangent,xy+reach*tangent
            ax.plot([a[0],b[0]],[a[1],b[1]],color=color,linewidth=1.7 if highlighted else .5,alpha=1 if highlighted or not emphasis else .55)
    clean(ax,[center[0]-extent,center[0]+extent,center[1]-extent,center[1]+extent])
    if selected:
        x,y=selected['crossing']; ax.plot(x,y,'o',mfc='white',mec=NAVY,ms=7,mew=1.5,zorder=10)

def prototiles():
    fig,axs=plt.subplots(1,2,figsize=(10,3.6))
    for ax,ang,color,label in zip(axs,[36,72],[BLUE,CORAL],['Thin rhombus','Thick rhombus']):
        a=np.radians(ang); v=np.array([np.cos(a),np.sin(a)])
        p=np.array([[0,0],[1,0],[1+v[0],v[1]],v])
        ax.add_patch(Polygon(p,facecolor=color,edgecolor=NAVY,lw=1.5))
        ax.add_patch(Arc((0,0),.55,.55,theta1=0,theta2=ang,color=NAVY,lw=1))
        ax.text(.4*np.cos(a/2),.4*np.sin(a/2),rf'${ang}^\circ$',ha='center',va='center',fontsize=15)
        ax.text(.9,.16,rf'${180-ang}^\circ$',ha='center',fontsize=13)
        ax.text(.5,-.14,'1',ha='center',fontsize=13)
        ax.text(.8,-.5,label,ha='center',fontsize=14)
        clean(ax,[-.15,2,-.62,1.12])
    fig.subplots_adjust(wspace=.15)
    save(fig,'figure2-prototiles')

def ribbon():
    fig,axs=plt.subplots(1,2,figsize=(10,4.8))
    family,index=0,0
    grid(axs[0],extent=4.8)
    x=index-G[family]
    axs[0].axvline(x,color=NAVY,lw=2.6)
    tiles(axs[1],DATA['tiles'],muted=True)
    for tile in DATA['tiles']:
        if tile['id'] in DATA['ribbon']['tileIds']:
            axs[1].add_patch(Polygon(tile['points'],facecolor=CORAL if tile['type']=='thick' else BLUE,edgecolor=NAVY,lw=1.6,zorder=5))
    axs[0].set_title(r'One grid line: $L_0(0)$',fontsize=13)
    axs[1].set_title('Its ribbon of rhombi',fontsize=13)
    fig.subplots_adjust(wspace=.16)
    save(fig,'figure3-ribbon')

def vectors_grid():
    fig,axs=plt.subplots(1,2,figsize=(10,4.5))
    ax=axs[0];clean(ax,[-1.45,1.45,-1.35,1.35])
    ax.add_patch(Circle((0,0),1,fill=False,color='#c5d4df',lw=.7))
    for j,v in enumerate(V):
        ax.annotate('',xy=v,xytext=(0,0),arrowprops={'arrowstyle':'->','color':NAVY,'lw':1.8})
        ax.text(*(v*1.2),rf'$\mathbf{{v}}_{j}$',ha='center',va='center',fontsize=17)
    ax.add_patch(Arc((0,0),.9,.9,theta1=0,theta2=72,color=CORAL,lw=2))
    ax.text(.52,.35,r'$2\pi/5$',fontsize=18,color=NAVY)
    grid(axs[1],extent=2.8,emphasis=False)
    axs[0].set_title('Five unit normals',fontsize=13)
    axs[1].set_title('Five line families',fontsize=13)
    fig.subplots_adjust(wspace=.2)
    save(fig,'figure4-directions-grid')

def clip(poly,normal,bound):
    out=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        da=np.dot(a,normal)-bound;db=np.dot(b,normal)-bound
        if da<=1e-10:out.append(a)
        if (da<0)!=(db<0):out.append(a+(b-a)*da/(da-db))
    return out

def cells_projection():
    t=DATA['selected'];x0=np.array(t['crossing']);r,s=t['r'],t['s']
    fig,axs=plt.subplots(1,2,figsize=(11,4.8))
    labels=[r'$K$',r'$K+e_0$',r'$K+e_0+e_1$',r'$K+e_1$']
    fills=['#edf4f9','#d8eaf4','#f6d9d3','#eaf0f7']
    offsets=[(-.61,-.56),(.58,-.53),(.51,.57),(-.57,.51)]
    for k,label,fill,offset in zip(t['coordinates'],labels,fills,offsets):
        poly=[x0+[-2,-2],x0+[2,-2],x0+[2,2],x0+[-2,2]]
        for j in range(5):
            poly=clip(poly,V[j],k[j]-G[j]);poly=clip(poly,-V[j],-k[j]+1+G[j])
        assert len(poly)>=3
        axs[0].add_patch(Polygon(poly,facecolor=fill,edgecolor='none',zorder=0))
        centroid=np.mean(poly,axis=0)
        axs[0].annotate(label,xy=centroid,xytext=x0+offset,ha='center',va='center',fontsize=12,zorder=20,arrowprops={'arrowstyle':'-','color':'#547a9b','lw':.7},bbox={'facecolor':'white','alpha':.94,'pad':2,'edgecolor':'none'})
    grid(axs[0],extent=.95,center=x0,selected=t)
    axs[0].set_title('Four cells around a crossing',fontsize=13)
    p=np.array(t['points']);mid=p.mean(axis=0)
    tiles(axs[1],[t],bounds=[mid[0]-1.2,mid[0]+1.2,mid[1]-1.1,mid[1]+1.1])
    for point,label in zip(p,[r'$f(K)$',r'$f(K)+v_0$',r'$f(K)+v_0+v_1$',r'$f(K)+v_1$']):
        offset=(point-mid)*.32
        axs[1].plot(*point,'o',color=NAVY,ms=4)
        axs[1].text(*(point+offset),label,ha='center',va='center',fontsize=12)
    axs[1].set_title('Four projected vertices',fontsize=13)
    fig.subplots_adjust(wspace=.26)
    save(fig,'figure5-cell-coordinates')

def linked():
    t=DATA['selected'];p=np.array(t['points']);center=p.mean(axis=0)
    fig,axs=plt.subplots(1,2,figsize=(10,4.7))
    grid(axs[0],extent=2.6,center=t['crossing'],selected=t)
    tiles(axs[1],DATA['tiles'],selected=t,bounds=[center[0]-3.1,center[0]+3.1,center[1]-3.1,center[1]+3.1],muted=True)
    axs[0].set_title(r'Grid lines $L_0(1)$ and $L_1(-2)$',fontsize=13)
    axs[1].set_title('The corresponding thick rhombus',fontsize=13)
    fig.subplots_adjust(wspace=.16)
    save(fig,'figure6-crossing-rhombus')

def main():
    prototiles();ribbon();vectors_grid();cells_projection();linked()
    print('Generated five PDF/SVG figure pairs (Figures 2–6; Figure 1 is the original table) from website geometry.')

if __name__=='__main__':main()
