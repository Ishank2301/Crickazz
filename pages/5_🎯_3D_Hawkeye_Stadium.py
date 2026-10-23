"""
🎯 3D Hawkeye Stadium & Camera Preset Viewport
Streamlit Page embedding the interactive Three.js 3D Cricket Pitch and Hawkeye Ball Tracker.
Features Preset Camera Views:
- Bird's Eye (360° aerial top-down view)
- Bowler's End (Trajectory view following swing & seam)
- Umpire View (1.75m eye level behind non-striker stumps for LBW line)
"""

import streamlit as st
import streamlit.components.v1 as components
from utils.threejs_stadium import get_threejs_pitch_html

st.set_page_config(
    page_title="3D Hawkeye Stadium - Cricbuzz LiveStats",
    page_icon="🎯",
    layout="wide",
)

st.title("🎯 Interactive 3D Stadium & Hawkeye Trajectory")
st.markdown(
    """
    **Real-time WebGL physics simulation** showing full 22-yard pitch geometry, delivery swing curvature, 
    and broadcast-grade **Preset Camera Views**.
    """
)

# Control information cards
col1, col2, col3 = st.columns(3)
with col1:
    st.info("🦅 **Bird's Eye**: 360° top-down aerial overview of pitch creases, field rings, and boundary dimensions.")
with col2:
    st.success("🎯 **Bowler's End**: Delivery run-up vantage following outswing, inswing, and seam deviation.")
with col3:
    st.warning("⚖️ **Umpire View**: Head-on LBW line & length alignment standing at 1.75m eye-level behind the stumps.")

# Embed the interactive Three.js 3D Canvas
html_content = get_threejs_pitch_html()
components.html(html_content, height=620, scrolling=False)

st.markdown(
    """
    ---
    💡 *Tip: You can use your mouse or trackpad inside the canvas to freely orbit, rotate, and zoom the camera.*
    """
)
