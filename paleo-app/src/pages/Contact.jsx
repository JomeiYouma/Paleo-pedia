import React from 'react';

const Contact = () => {
    return (
        <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--color-pink-darker, #C2185B)' }}>Contact</h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                Vous avez une question, une suggestion ou vous souhaitez participer au projet ? Écrivez-nous !
            </p>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nom et Prénom</label>
                    <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email</label>
                    <input type="email" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Sujet</label>
                    <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Message</label>
                    <textarea rows="5" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
                </div>

                <button type="submit" style={{ background: 'black', color: 'white', border: 'none', padding: '15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                    Envoyer
                </button>
            </form>
        </div>
    );
};

export default Contact;
