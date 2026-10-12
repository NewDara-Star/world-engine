import sys,json,torch,numpy as np; sys.path.insert(0,'.')
import fit
from PIL import Image
z=np.load('hatch.npz'); d=json.load(open(sys.argv[1])); m=fit.Shapes(d['rows'])
sdf=z['sdf']; o=z['origin']; pt=float(z['pitch'])
out=[]
for xi in [sdf.shape[0]//2, int(sdf.shape[0]*0.8)]:
  J,K=np.meshgrid(np.arange(sdf.shape[1]),np.arange(sdf.shape[2]),indexing='ij')
  P=np.stack([np.full(J.shape,o[0]+xi*pt),o[1]+J*pt,o[2]+K*pt],-1).reshape(-1,3)
  with torch.no_grad(): pr=m(torch.tensor(P,dtype=torch.float32)).numpy().reshape(J.shape)
  g=sdf[xi]; img=np.zeros(J.shape+(3,),np.uint8)+240
  img[(g<0)&(pr<0)]=(70,70,70); img[(g<0)&(pr>=0)]=(214,69,65); img[(g>=0)&(pr<0)]=(59,130,246)
  out.append(Image.fromarray(img[::-1]).resize((860,300),Image.NEAREST))
c=Image.new('RGB',(860,600)); c.paste(out[0],(0,0)); c.paste(out[1],(0,300)); c.save(sys.argv[2])
