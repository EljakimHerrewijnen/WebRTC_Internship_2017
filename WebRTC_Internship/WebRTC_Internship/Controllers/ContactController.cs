using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using WebRTC_Internship.Models;
using System.Web;
using WebRTC_Internship.Data;
using Microsoft.AspNetCore.Identity;

namespace WebRTC_Internship.Controllers
{
    [RequireHttps]
    [Authorize]
    [Route("/api/[controller]/[action]")]
    public class ContactController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        VideochatDBContext db = new VideochatDBContext();
        public IActionResult Contact()
        {
            return Redirect("https://www.herreweb.nl/api/Contact/Home");
        }
        public IActionResult Home()
        {
            return View();
        }

        [HttpGet("{username}")]
        public async Task<IActionResult> Addcontact(string username)
        {
            var user = await _userManager.FindByNameAsync(username);
            return Content(user.Id.ToString());
            //var local = ApplicationDbContext;
            //foreach()
        }

        public IActionResult Personal()
        {
            return View();
        }

        [HttpGet("{contactid}")]
        public IActionResult Callcontact()
        {
            return Redirect("www.nu.nl");
        }

        [HttpGet("{contactid}")]
        public IActionResult ShowContact(string contactid)
        {
            string text = "";
            foreach (ContactModel contact in db.Contact)
            {
                if(contact.User_ID == contactid)
                {
                    text += contact.ContactUUID.ToString() + "\n";
                }

            }
            return Content(text);
        }

        [HttpGet("{searchquery}")]
        public IActionResult Search(string searchquery)
        {
            string result = "";
            return Content(result);
        }
    }
}